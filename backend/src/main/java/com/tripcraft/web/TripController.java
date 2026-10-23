package com.tripcraft.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tripcraft.trip.TripService;
import com.tripcraft.web.dto.RegenerateDayRequest;
import com.tripcraft.web.dto.TripRequest;
import com.tripcraft.web.dto.TripResponse;
import com.tripcraft.web.dto.TripSummary;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Trips API, see docs/API.md. */
@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse create(@Valid @RequestBody TripRequest request) {
        return TripResponse.from(tripService.create(request));
    }

    @GetMapping
    public List<TripSummary> list() {
        return tripService.list().stream().map(TripSummary::from).toList();
    }

    @GetMapping("/{id}")
    public TripResponse get(@PathVariable Long id) {
        return TripResponse.from(tripService.get(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tripService.delete(id);
    }

    @PostMapping("/{id}/days/{dayNumber}/regenerate")
    public TripResponse regenerateDay(@PathVariable Long id, @PathVariable int dayNumber,
                                      @Valid @RequestBody(required = false) RegenerateDayRequest request) {
        String feedback = request == null ? null : request.feedback();
        return TripResponse.from(tripService.regenerateDay(id, dayNumber, feedback));
    }

    @PostMapping("/{id}/packing-list")
    public TripResponse packingList(@PathVariable Long id) {
        return TripResponse.from(tripService.generatePackingList(id));
    }
}
