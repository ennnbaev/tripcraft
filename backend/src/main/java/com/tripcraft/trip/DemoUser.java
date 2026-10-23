package com.tripcraft.trip;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/** The single user every trip belongs to until authentication exists (seeded by V2 migration). */
@Component
@RequiredArgsConstructor
public class DemoUser {

    static final String EMAIL = "demo@tripcraft.local";

    private final JdbcClient jdbcClient;
    private volatile Long id;

    public Long id() {
        if (id == null) {
            id = jdbcClient.sql("SELECT id FROM users WHERE email = ?")
                    .param(EMAIL)
                    .query(Long.class)
                    .single();
        }
        return id;
    }
}
