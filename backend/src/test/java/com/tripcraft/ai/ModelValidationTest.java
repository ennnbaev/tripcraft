package com.tripcraft.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.tripcraft.ai.model.Activity;
import com.tripcraft.ai.model.Category;
import com.tripcraft.ai.model.Day;
import com.tripcraft.ai.model.Slot;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class ModelValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validDayPasses() {
        assertThat(validator.validate(day(activity("09:30", BigDecimal.TEN)))).isEmpty();
    }

    @Test
    void nestedActivityErrorsAreReported() {
        Day day = day(activity("9.30am", BigDecimal.valueOf(-5)));

        assertThat(validator.validate(day)).extracting(ConstraintViolation::getPropertyPath).map(Object::toString)
                .containsExactlyInAnyOrder("activities[0].time", "activities[0].estimatedCost");
    }

    @Test
    void dayWithoutActivitiesFails() {
        assertThat(validator.validate(new Day(1, LocalDate.now(), "Title", List.of(), null, null))).isNotEmpty();
    }

    private static Day day(Activity activity) {
        return new Day(1, LocalDate.now(), "Title", List.of(activity), null, null);
    }

    private static Activity activity(String time, BigDecimal cost) {
        return new Activity(Slot.MORNING, time, "Narikala", "Fortress", Category.HISTORY, cost, BigDecimal.ONE, 60,
                null, null);
    }
}
