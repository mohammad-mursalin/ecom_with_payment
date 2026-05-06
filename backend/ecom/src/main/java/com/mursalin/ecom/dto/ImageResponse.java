package com.mursalin.ecom.dto;

import lombok.Data;

public class ImageResponse {

    private Data data;
    private boolean success;
    private int status;

    // Getters and Setters for outer class
    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    // Custom helper methods
    public String getDeleteHash() {
        return data != null ? data.getDeleteHash() : null;
    }

    public String getImageUrl() {
        return data != null ? data.getLink() : null;
    }

    @Override
    public String toString() {
        return "ImageResponse{" +
                "data=" + data +
                ", success=" + success +
                ", status=" + status +
                '}';
    }

    // Static inner class
    public static class Data {

        private String deletehash;
        private String link;

        // Getters and Setters
        public String getDeleteHash() {
            return deletehash;
        }

        public void setDeleteHash(String deleteHash) {
            this.deletehash = deleteHash;
        }

        public String getLink() {
            return link;
        }

        public void setLink(String link) {
            this.link = link;
        }

        @Override
        public String toString() {
            return "Data{" +
                    "deletehash='" + deletehash + '\'' +
                    ", link='" + link + '\'' +
                    '}';
        }
    }
}
