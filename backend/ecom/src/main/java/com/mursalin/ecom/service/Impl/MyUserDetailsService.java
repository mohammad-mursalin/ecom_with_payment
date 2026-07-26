package com.mursalin.ecom.service.Impl;

import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.repository.UserRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class MyUserDetailsService implements UserDetailsService {

    private final UserRepository repo;

    public MyUserDetailsService(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(@NotNull String email) throws UsernameNotFoundException {
        Optional<User> userOpt = repo.findByEmail(email);

        if (userOpt.isPresent()) {
            return new UserPrinciples(userOpt.get());
        } else {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
    }
}
