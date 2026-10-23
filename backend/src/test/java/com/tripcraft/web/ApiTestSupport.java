package com.tripcraft.web;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

/** Shared setup for API tests: empty trips and ai_requests tables in the {@code test} schema. */
abstract class ApiTestSupport {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcClient jdbc;

    @BeforeEach
    void cleanTables() {
        jdbc.sql("TRUNCATE trips, ai_requests RESTART IDENTITY CASCADE").update();
    }

    protected static String tripJson(int days) {
        LocalDate start = LocalDate.now().plusDays(7);
        return """
                {"destination":"Tbilisi, Georgia","startDate":"%s","endDate":"%s","travelers":2,
                 "budgetLevel":"MEDIUM","interests":["FOOD","HISTORY"],"pace":"BALANCED","notes":"no museums on Monday"}
                """.formatted(start, start.plusDays(days - 1L));
    }

    protected long count(String sql) {
        return jdbc.sql(sql).query(Long.class).single();
    }
}
