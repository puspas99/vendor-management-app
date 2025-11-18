package com.evoke.vendor.repository;

import com.evoke.vendor.entity.AIMessageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AIMessageHistoryRepository extends JpaRepository<AIMessageHistory, Long> {
    
    List<AIMessageHistory> findByFollowUpIdOrderByCreatedAtDesc(Long followUpId);
    
    @Query("SELECT AVG(a.tokensUsed) FROM AIMessageHistory a WHERE a.createdAt >= :startDate")
    Double getAverageTokensUsed(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(a) FROM AIMessageHistory a WHERE a.wasEdited = true AND a.createdAt >= :startDate")
    Long countEditedMessages(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT AVG(CAST(a.userRating AS double)) FROM AIMessageHistory a WHERE a.userRating IS NOT NULL AND a.createdAt >= :startDate")
    Double getAverageRating(@Param("startDate") LocalDateTime startDate);
}
