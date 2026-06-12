package com.smartpark.ai.repository;

import com.smartpark.ai.entity.EntryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntryLogRepository extends JpaRepository<EntryLog, Long> {
    List<EntryLog> findByQrPassId(Long qrPassId);
}
