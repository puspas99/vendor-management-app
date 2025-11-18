package com.evoke.config;

import com.evoke.auth.Constants;
import com.evoke.auth.entity.Role;
import com.evoke.auth.entity.User;
import com.evoke.auth.repository.RoleRepository;
import com.evoke.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeRoles();
        initializeUsers();
    }

    private void initializeRoles() {
        if (roleRepository.count() == 0) {
            Role adminRole = Role.builder()
                    .name(Constants.ROLE_ADMIN)
                    .description("Administrator role with full access")
                    .build();

            Role procurementRole = Role.builder()
                    .name(Constants.ROLE_PROCUREMENT)
                    .description("Procurement team role")
                    .build();

            Role vendorRole = Role.builder()
                    .name(Constants.ROLE_VENDOR)
                    .description("Vendor role")
                    .build();
                    
             Role userRole = Role.builder()
                    .name(Constants.ROLE_USER)
                    .description("User role")
                    .build();

            roleRepository.save(adminRole);
            roleRepository.save(procurementRole);
            roleRepository.save(vendorRole);
            roleRepository.save(userRole);

            log.info("Roles initialized successfully");
        }
    }

    private void initializeUsers() {
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName(Constants.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            //Role procurementRole = roleRepository.findByName(Constants.ROLE_PROCUREMENT)
            //        .orElseThrow(() -> new RuntimeException("Procurement role not found"));

            Set<Role> adminRoles = new HashSet<>();
            adminRoles.add(adminRole);

            User adminUser = User.builder()
                    .email("admin@vendormanagement.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("System Administrator")
                    .department("IT")
                    .roles(adminRoles)
                    .enabled(true)
                    .username("admin")
                    .status("ACTIVE")
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .build();

            Set<Role> procurementRoles = new HashSet<>();
            //procurementRoles.add(procurementRole);

            User procurementUser = User.builder()
                    .email("procurement@vendormanagement.com")
                    .password(passwordEncoder.encode("Procurement@123"))
                    .fullName("Procurement Manager")
                    .department("Procurement")
                   // .roles(procurementRoles)
                    .enabled(true)
                    .username("procurement")
                    .status("ACTIVE")
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .build();

            userRepository.save(adminUser);
          //  userRepository.save(procurementUser);

            log.info("Default users initialized successfully");
            log.info("Admin user: admin@vendormanagement.com / Admin@123");
            log.info("Procurement user: procurement@vendormanagement.com / Procurement@123");
        }
    }
}
