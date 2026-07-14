package com.mursalin.ecom.chat.tool.escalation;

import com.mursalin.ecom.chat.tool.ToolErrorCode;
import com.mursalin.ecom.chat.tool.ToolResult;
import org.springframework.stereotype.Service;

@Service
public class EscalationTools {

    public ToolResult<EscalationResult> escalateToHuman(String reason) {
        if (reason == null || reason.isBlank()) {
            return ToolResult.failure(ToolErrorCode.VALIDATION_ERROR);
        }
        return ToolResult.success(new EscalationResult(true));
    }

    public record EscalationResult(boolean logged) {
    }
}
