package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class ImageResponse {

    private Data data;
    private boolean success;
    private int status;

    // Custom helper methods
    public String getDeleteHash() {
        return data != null ? data.getDeleteHash() : null;
    }

    public String getImageUrl() {
        return data != null ? data.getLink() : null;
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
