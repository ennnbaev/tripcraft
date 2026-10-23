package com.tripcraft.web.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import com.tripcraft.trip.BudgetLevel;
import com.tripcraft.trip.Interest;
import com.tripcraft.trip.Pace;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class TripRequestValidationTest {

    private static final LocalDate TOMORROW = LocalDate.now().plusDays(1);

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validRequestPasses() {
        assertThat(invalidFields(request(TOMORROW, TOMORROW.plusDays(2), List.of(Interest.FOOD)))).isEmpty();
    }

    @Test
    void startDateInThePastFails() {
        assertThat(invalidFields(request(LocalDate.now().minusDays(1), TOMORROW, List.of(Interest.FOOD))))
                .containsExactly("startDate");
    }

    @Test
    void endBeforeStartFails() {
        assertThat(invalidFields(request(TOMORROW.plusDays(3), TOMORROW, List.of(Interest.FOOD))))
                .containsExactly("endDate");
    }

    @Test
    void fourteenDaysIsTheLimit() {
        assertThat(invalidFields(request(TOMORROW, TOMORROW.plusDays(13), List.of(Interest.FOOD)))).isEmpty();
        assertThat(invalidFields(request(TOMORROW, TOMORROW.plusDays(14), List.of(Interest.FOOD))))
                .containsExactly("endDate");
    }

    @Test
    void duplicateOrMissingInterestsFail() {
        assertThat(invalidFields(request(TOMORROW, TOMORROW, List.of(Interest.FOOD, Interest.FOOD))))
                .containsExactly("interests");
        assertThat(invalidFields(request(TOMORROW, TOMORROW, List.of()))).containsExactly("interests");
    }

    @Test
    void languageDefaultsToEnglish() {
        assertThat(request(TOMORROW, TOMORROW, List.of(Interest.FOOD)).languageOrDefault()).isEqualTo("English");
    }

    private Set<String> invalidFields(TripRequest request) {
        return validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());
    }

    private static TripRequest request(LocalDate start, LocalDate end, List<Interest> interests) {
        return new TripRequest("Tbilisi", start, end, 2, BudgetLevel.MEDIUM, interests, Pace.BALANCED, null, " ");
    }
}
