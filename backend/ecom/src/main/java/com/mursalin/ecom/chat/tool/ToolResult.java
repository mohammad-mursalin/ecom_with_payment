package com.mursalin.ecom.chat.tool;

public class ToolResult<T> {

    private boolean ok;
    private T data;
    private String error;
    private String message;

    protected ToolResult() {
    }

    public ToolResult(boolean ok, T data, String error, String message) {
        this.ok = ok;
        this.data = data;
        this.error = error;
        this.message = message;
    }

    public static <T> ToolResult<T> success(T data) {
        return new ToolResult<>(true, data, null, null);
    }

    public static <T> ToolResult<T> failure(ToolErrorCode errorCode) {
        return new ToolResult<>(false, null, errorCode.name(), null);
    }

    public static <T> ToolResult<T> failure(ToolErrorCode errorCode, String message) {
        return new ToolResult<>(false, null, errorCode.name(), message);
    }

    public boolean isOk() {
        return ok;
    }

    public T getData() {
        return data;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }
}
