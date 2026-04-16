package com.mursalin.ecom.dto;

import lombok.Data;

@Data
public class ImageResponse {

    private Data data;
    private boolean success;
    private int status;

    @lombok.Data
    public static class Data {
        private String deletehash;
        private String link;

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
    }

    public String getDeleteHash() {
        return data.getDeleteHash();
    }

    public String getImageUrl() {
        return data.getLink();
    }
}
