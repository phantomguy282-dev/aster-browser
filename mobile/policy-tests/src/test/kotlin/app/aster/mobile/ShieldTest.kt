package app.aster.mobile

import org.junit.Assert.*
import org.junit.Test

class ShieldTest {
    @Test fun modesEnforceDifferentPolicies() {
        val s = MobileShield()
        s.replace(MobileShield.Category.THREAT, listOf("bad.example"))
        s.replace(MobileShield.Category.TRACKER, listOf("ads.example"))
        assertTrue(s.decide("https://bad.example/", true).blocked)
        assertFalse(s.decide("https://ads.example/script.js", false).blocked)
        s.mode = MobileShield.Mode.ENHANCED
        assertTrue(s.decide("https://ads.example/script.js", false).blocked)
        assertFalse(s.decide("https://ads.example/", true).blocked)
        s.mode = MobileShield.Mode.STRICT
        assertTrue(s.decide("https://ads.example/", true).blocked)
        s.trackerProtection = false
        assertFalse(s.decide("https://ads.example/", true).blocked)
    }
    @Test fun adultFilterIsOptionalAndSubdomainsDoNotMatchSuffixLookalikes() {
        val s = MobileShield()
        s.replace(MobileShield.Category.ADULT, listOf("adult.example"))
        assertFalse(s.decide("https://adult.example/", true).blocked)
        s.adultFiltering = true
        assertEquals(MobileShield.Category.ADULT, s.decide("https://sub.adult.example/", true).category)
        assertFalse(s.decide("https://notadult.example/", true).blocked)
        assertFalse(s.decide("https://adult.example.other/", true).blocked)
    }
    @Test fun exceptionsAndEmptyListsAreHonest() {
        val s = MobileShield()
        assertEquals(0, s.count(MobileShield.Category.THREAT))
        assertFalse(s.decide("https://unknown.example/", true).blocked)
        s.replace(MobileShield.Category.THREAT, listOf("bad.example"))
        s.setExceptions(listOf("bad.example"))
        assertFalse(s.decide("https://sub.bad.example/", true).blocked)
        s.setExceptions(emptyList())
        assertTrue(s.decide("https://sub.bad.example/", true).blocked)
    }
    @Test fun invalidListCannotPartiallyReplaceRules() {
        val s = MobileShield()
        s.replace(MobileShield.Category.THREAT, listOf("old.example"))
        try { s.replace(MobileShield.Category.THREAT, listOf("new.example", "https://bad.example")); fail("Expected rejection") } catch (_: IllegalArgumentException) { }
        assertTrue(s.decide("https://old.example/", true).blocked)
        assertFalse(s.decide("https://new.example/", true).blocked)
        assertEquals("xn--bcher-kva.de", MobileShield.domain("bücher.de"))
    }
}
