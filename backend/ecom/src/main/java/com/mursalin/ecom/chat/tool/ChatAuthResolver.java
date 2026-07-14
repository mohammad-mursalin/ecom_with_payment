package com.mursalin.ecom.chat.tool;

import com.mursalin.ecom.model.UserPrinciples;
import org.springframework.security.core.context.SecurityContextHolder;

public class ChatAuthResolver {

    private ChatAuthResolver() {
    }

    public static Long resolveUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrinciples)) {
            return null;
        }
        return ((UserPrinciples) auth.getPrincipal()).getUserId();
    }
}
