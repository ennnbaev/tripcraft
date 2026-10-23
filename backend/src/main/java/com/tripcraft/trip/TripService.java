package com.tripcraft.trip;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripcraft.ai.AiRequestRepository;
import com.tripcraft.ai.AiResult;
import com.tripcraft.ai.ItineraryAiService;
import com.tripcraft.ai.TripBrief;
import com.tripcraft.ai.model.Day;
import com.tripcraft.ai.model.Itinerary;
import com.tripcraft.ai.model.PackingList;
import com.tripcraft.common.BadRequestException;
import com.tripcraft.common.NotFoundException;
import com.tripcraft.web.dto.TripRequest;

import lombok.RequiredArgsConstructor;

/**
 * Trip use cases. AI calls run outside a DB transaction (they can take tens of seconds);
 * the trip is written only after the AI answered, so a failed call changes nothing.
 */
@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final AiRequestRepository aiRequestRepository;
    private final ItineraryAiService aiService;
    private final DemoUser demoUser;

    public Trip create(TripRequest request) {
        Trip trip = new Trip();
        trip.setUserId(demoUser.id());
        trip.setDestination(request.destination().strip());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        trip.setTravelers(request.travelers());
        trip.setBudgetLevel(request.budgetLevel());
        trip.setPace(request.pace());
        trip.setInterests(List.copyOf(request.interests()));
        trip.setNotes(request.notes() == null || request.notes().isBlank() ? null : request.notes().strip());
        trip.setLanguage(request.languageOrDefault());

        AiResult<Itinerary> result = aiService.generate(brief(trip));
        trip.setItinerary(result.value());
        Trip saved = tripRepository.save(trip);
        aiRequestRepository.linkToTrip(result.logIds(), saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<TripSummaryView> list() {
        return tripRepository.findByUserIdOrderByCreatedAtDescIdDesc(demoUser.id());
    }

    @Transactional(readOnly = true)
    public Trip get(Long id) {
        return tripRepository.findByIdAndUserId(id, demoUser.id())
                .orElseThrow(() -> new NotFoundException("Trip " + id + " not found"));
    }

    @Transactional
    public void delete(Long id) {
        tripRepository.delete(get(id));
    }

    /** Replaces one day; the other days stay as they are and the totals are recomputed. */
    public Trip regenerateDay(Long id, int dayNumber, String feedback) {
        Trip trip = get(id);
        Itinerary itinerary = trip.getItinerary();
        if (itinerary == null) {
            throw new BadRequestException("Trip " + id + " has no itinerary");
        }
        if (dayNumber < 1 || dayNumber > itinerary.days().size()) {
            throw new BadRequestException("Day " + dayNumber + " is outside the trip (1.." + itinerary.days().size() + ")");
        }

        AiResult<Day> result = aiService.regenerateDay(brief(trip), id, itinerary, dayNumber, feedback);
        List<Day> days = new ArrayList<>(itinerary.days());
        days.set(dayNumber - 1, result.value());
        trip.setItinerary(itinerary.withDays(days).withRecomputedCosts());
        return tripRepository.save(trip);
    }

    public Trip generatePackingList(Long id) {
        Trip trip = get(id);
        if (trip.getItinerary() == null) {
            throw new BadRequestException("Trip " + id + " has no itinerary");
        }
        AiResult<PackingList> result = aiService.packingList(brief(trip), id, trip.getItinerary());
        trip.setPackingList(result.value());
        return tripRepository.save(trip);
    }

    private static TripBrief brief(Trip trip) {
        return new TripBrief(trip.getDestination(), trip.getStartDate(), trip.getEndDate(), trip.getTravelers(),
                trip.getBudgetLevel().name(), trip.getInterests().stream().map(Enum::name).toList(),
                trip.getPace().name(), trip.getNotes(), trip.getLanguage());
    }
}
