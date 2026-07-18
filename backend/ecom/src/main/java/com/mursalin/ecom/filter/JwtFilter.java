package com.mursalin.ecom.filter;

import com.mursalin.ecom.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(1)
public class JwtFilter extends OncePerRequestFilter {

    //private ApplicationContext applicationContext;

    private final JwtService jwtService;

    private final UserDetailsService userDetailsService;

    public JwtFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

//    public JwtFilter(ApplicationContext applicationContext, JwtService jwtService) {
//        this.applicationContext = applicationContext;
//        this.jwtService = jwtService;
//    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String username = null;
        String token = null;

        if(authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            username = jwtService.extractUsername(token);
        }

        if(username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

//            UserDetails userDetails = applicationContext.getBean(MyUserDetailsService.class).loadUserByUsername(username);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if(jwtService.validateToken(token, userDetails)) {
                UsernamePasswordAuthenticationToken upaToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                upaToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(upaToken);
            }
        }
        filterChain.doFilter(request, response);

    }
}
