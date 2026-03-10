import React from "react";
import { useEffect } from "react";
import { router } from "expo-router";

export default function AddAccountScreen() {
  useEffect(() => {
    router.replace("/profile");
  }, []);
  return null;
}
