package com.smartpark.ai.service;

import com.smartpark.ai.entity.AuditLog;
import com.smartpark.ai.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(String action, String entityName, Long entityId, String performedBy) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .performedBy(performedBy)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional
    public void logAction(String action, String entityName, Long entityId) {
        String username = "SYSTEM";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            username = auth.getName();
        }
        logAction(action, entityName, entityId, username);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findByOrderByTimestampDesc();
    }
}
