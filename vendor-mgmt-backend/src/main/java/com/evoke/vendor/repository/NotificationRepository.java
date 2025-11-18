package com.evoke.vendor.repository;

import com.evoke.vendor.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String recipientUsername);
    
    List<Notification> findByRecipientUsernameAndIsReadOrderByCreatedAtDesc(
            String recipientUsername, Boolean isRead);
    
    @Query("SELECT n FROM Notification n WHERE n.recipientUsername = :username " +
           "AND n.createdAt > :since ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(
            @Param("username") String username, 
            @Param("since") LocalDateTime since);
    
    Long countByRecipientUsernameAndIsRead(String recipientUsername, Boolean isRead);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.id = :notificationId")
    void markAsRead(@Param("notificationId") Long notificationId, 
                    @Param("readAt") LocalDateTime readAt);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.recipientUsername = :username AND n.isRead = false")
    void markAllAsRead(@Param("username") String username, 
                       @Param("readAt") LocalDateTime readAt);
    
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}
