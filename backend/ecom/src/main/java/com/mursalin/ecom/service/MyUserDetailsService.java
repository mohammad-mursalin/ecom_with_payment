package com.mursalin.ecom.service;

import com.mursalin.ecom.model.User;
import com.mursalin.ecom.model.UserPrinciples;
import com.mursalin.ecom.repository.UserRepository;
import org.jspecify.annotations.NonNull;
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
    public UserDetails loadUserByUsername(@NonNull String email) throws UsernameNotFoundException {
        Optional<User> userOpt = repo.findByEmail(email);

        if (userOpt.isPresent()) {
            return new UserPrinciples(userOpt.get());
        } else {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
    }
}
