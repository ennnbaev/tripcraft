package com.tripcraft.web;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.tripcraft.ai.AiRateLimitException;
import com.tripcraft.ai.AiUnavailableException;
import com.tripcraft.common.BadRequestException;
import com.tripcraft.common.NotFoundException;
import com.tripcraft.web.dto.ErrorResponse;

import lombok.extern.slf4j.Slf4j;

/** Maps exceptions to the unified {@link ErrorResponse} (docs/API.md, "Errors"). */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException e) {
        Map<String, String> details = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(f -> details.merge(f.getField(), f.getDefaultMessage(), (a, b) -> a + "; " + b));
        e.getBindingResult().getGlobalErrors()
                .forEach(g -> details.merge(g.getObjectName(), g.getDefaultMessage(), (a, b) -> a + "; " + b));
        return error(HttpStatus.BAD_REQUEST, new ErrorResponse("Validation failed", details));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorResponse> unreadable(HttpMessageNotReadableException e) {
        Map<String, String> details = new LinkedHashMap<>();
        if (e.getCause() instanceof JsonMappingException mapping && !mapping.getPath().isEmpty()) {
            String field = mapping.getPath().getLast().getFieldName();
            String message = mapping instanceof InvalidFormatException invalid && invalid.getTargetType().isEnum()
                    ? "must be one of " + Arrays.toString(invalid.getTargetType().getEnumConstants())
                    : "invalid value";
            if (field != null) {
                details.put(field, message);
            }
        }
        return error(HttpStatus.BAD_REQUEST, new ErrorResponse("Malformed request body", details));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ErrorResponse> typeMismatch(MethodArgumentTypeMismatchException e) {
        return error(HttpStatus.BAD_REQUEST, new ErrorResponse("Invalid path or query parameter",
                Map.of(e.getName(), "invalid value")));
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<ErrorResponse> badRequest(BadRequestException e) {
        return error(HttpStatus.BAD_REQUEST, ErrorResponse.of(e.getMessage()));
    }

    @ExceptionHandler({NotFoundException.class, NoResourceFoundException.class})
    ResponseEntity<ErrorResponse> notFound(Exception e) {
        return error(HttpStatus.NOT_FOUND, ErrorResponse.of(
                e instanceof NotFoundException ? e.getMessage() : "Not found"));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorResponse> methodNotAllowed(HttpRequestMethodNotSupportedException e) {
        return error(HttpStatus.METHOD_NOT_ALLOWED, ErrorResponse.of(e.getMessage()));
    }

    @ExceptionHandler(AiRateLimitException.class)
    ResponseEntity<ErrorResponse> rateLimited(AiRateLimitException e) {
        return error(HttpStatus.TOO_MANY_REQUESTS, ErrorResponse.of(e.getMessage()));
    }

    @ExceptionHandler(AiUnavailableException.class)
    ResponseEntity<ErrorResponse> aiUnavailable(AiUnavailableException e) {
        return error(HttpStatus.BAD_GATEWAY, ErrorResponse.of(e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> unexpected(Exception e) {
        log.error("Unexpected error", e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, ErrorResponse.of("Unexpected server error"));
    }

    private static ResponseEntity<ErrorResponse> error(HttpStatus status, ErrorResponse body) {
        return ResponseEntity.status(status).body(body);
    }
}
