package com.tripcraft.ai;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface AiRequestRepository extends JpaRepository<AiRequest, Long> {

    @Transactional
    @Modifying
    @Query("update AiRequest r set r.tripId = :tripId where r.id in :ids")
    void linkToTrip(Collection<Long> ids, Long tripId);
}
