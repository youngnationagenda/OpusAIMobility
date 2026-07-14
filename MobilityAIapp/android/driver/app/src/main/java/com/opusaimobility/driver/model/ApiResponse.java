package com.opusaimobility.driver.model;

import com.google.gson.annotations.SerializedName;

/**
 * ApiResponse — Generic wrapper for all terraaimobility-api responses.
 *
 * All API endpoints return:
 * {
 *   "code": "200" | "201" | "400" | "401" | "404",
 *   "msg": <any>
 * }
 */
public class ApiResponse {

    @SerializedName("code")
    public String code;

    @SerializedName("msg")
    public Object msg;

    public boolean isSuccess() {
        return "200".equals(code);
    }

    public String getCodeInt() {
        return code;
    }
}
