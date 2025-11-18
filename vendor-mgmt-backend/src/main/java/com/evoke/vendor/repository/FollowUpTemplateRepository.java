package com.evoke.vendor.repository;

import com.evoke.vendor.entity.FollowUpTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowUpTemplateRepository extends JpaRepository<FollowUpTemplate, Long> {
    
    List<FollowUpTemplate> findByIsActiveTrue();
    
    List<FollowUpTemplate> findByFollowUpTypeAndIsActiveTrue(String followUpType);
    
    @Query("SELECT t FROM FollowUpTemplate t WHERE t.followUpType = :followUpType AND t.escalationLevel = :escalationLevel AND t.isActive = true ORDER BY t.createdAt DESC")
    Optional<FollowUpTemplate> findByFollowUpTypeAndEscalationLevel(
        @Param("followUpType") String followUpType,
        @Param("escalationLevel") Integer escalationLevel
    );
    
    @Query("SELECT t FROM FollowUpTemplate t WHERE t.followUpType = :followUpType AND t.isActive = true ORDER BY t.escalationLevel ASC, t.createdAt DESC")
    List<FollowUpTemplate> findTemplatesForType(@Param("followUpType") String followUpType);
}
