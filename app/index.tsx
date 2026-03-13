/**
 * Root entry for web & native.  Expo-router doesn’t render anything at '/'
 * by default, so we redirect immediately to the login page.  This makes the
 * app visible when you open http://localhost:19006 (or Metro’s 8081) in a
 * browser.
 */
import React from 'react';
import { Redirect } from 'expo-router';

// simple redirect using built-in component avoids navigation before layout mounting
export default function Index() {
  return <Redirect href="/login" />;
}
