package com.tripcraft.web.dto;

import java.time.temporal.ChronoUnit;
import java.util.HashSet;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TripRequestValidator implements ConstraintValidator<ValidTripRequest, TripRequest> {

    @Override
    public boolean isValid(TripRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }
        boolean valid = true;
        context.disableDefaultConstraintViolation();

        if (request.startDate() != null && request.endDate() != null) {
            long days = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;
            if (days < 1) {
                valid = violation(context, "endDate", "must be on or after the start date");
            } else if (days > TripRequest.MAX_DAYS) {
                valid = violation(context, "endDate", "trip can be at most " + TripRequest.MAX_DAYS + " days long");
            }
        }
        if (request.interests() != null
                && new HashSet<>(request.interests()).size() != request.interests().size()) {
            valid = violation(context, "interests", "must not contain duplicates");
        }
        return valid;
    }

    private static boolean violation(ConstraintValidatorContext context, String field, String message) {
        context.buildConstraintViolationWithTemplate(message).addPropertyNode(field).addConstraintViolation();
        return false;
    }
}
