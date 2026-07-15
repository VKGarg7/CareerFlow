package com.careerflow.common;

public interface GroupedCountRow<S extends Enum<S>> {
    S getStatus();
    long getTotal();
}