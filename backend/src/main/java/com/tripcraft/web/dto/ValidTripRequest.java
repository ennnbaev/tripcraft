package com.tripcraft.web.dto;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/** Cross-field checks of {@link TripRequest}; violations are reported on the offending field. */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = TripRequestValidator.class)
public @interface ValidTripRequest {

    String message() default "invalid trip";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
