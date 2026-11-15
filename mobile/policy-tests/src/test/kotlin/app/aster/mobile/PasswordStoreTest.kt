package app.aster.mobile

import org.junit.Assert.*
import org.junit.Test

class PasswordStoreTest {
    // Deterministic test sealer (not real crypto — crypto is verified on device via PasswordCrypto).
    private class FakeSealer : PasswordSealer {
        private val xor = byteArrayOf(0x5a, 0x2f, 0x11)
        override fun encrypt(plain: CharArray): ByteArray {
            val bytes = String(plain).toByteArray(Charsets.UTF_8)
            return ByteArray(bytes.size) { (bytes[it].toInt() xor xor[it % xor.size].toInt()).toByte() }
        }
        override fun decrypt(sealed: ByteArray): CharArray {
            val bytes = ByteArray(sealed.size) { (sealed[it].toInt() xor xor[it % xor.size].toInt()).toByte() }
            return String(bytes, Charsets.UTF_8).toCharArray()
        }
    }
    private fun store() = PasswordStore(FakeSealer())
    @Test fun originBindingIsStrict() {
        assertEquals("https://example.com", PasswordStore.originOf("https://example.com/login?next=/x"))
        assertEquals("https://example.com", PasswordStore.originOf("https://EXAMPLE.com"))
        assertEquals("https://example.com:8443", PasswordStore.originOf("https://example.com:8443/"))
        assertNull(PasswordStore.originOf("http://example.com/"))
        assertNull(PasswordStore.originOf("file:///x"))
        assertNull(PasswordStore.originOf("javascript:alert(1)"))
        assertNull(PasswordStore.originOf("https://user:pass@example.com/"))
        assertNull(PasswordStore.originOf(""))
    }

    @Test fun addRequiresHttpsAndBindsExactOrigin() {
        val store = store()
        val rec = store.add("https://mail.example.com/session", "dan@example.com", "pw-one".toCharArray(), "Mail")
        assertEquals("https://mail.example.com", rec.origin)
        assertEquals("pw-one", rec.password(FakeSealer()))
        assertTrue(store.forOrigin("https://mail.example.com/anything").isNotEmpty())
        // Different port = different origin; no cross-origin leakage.
        assertTrue(store.forOrigin("https://mail.example.com:8443/").isEmpty())
        try { store.add("http://insecure.example.com/", "x", "p".toCharArray()); fail("Expected HTTPS-only rejection") } catch (_: IllegalArgumentException) { }
    }

    @Test fun multipleAccountsAndLifecycle() {
        val store = store()
        store.add("https://example.com/", "a@x", "first".toCharArray())
        val second = store.add("https://example.com/", "b@x", "second".toCharArray())
        assertEquals(2, store.forOrigin("https://example.com/").size)
        store.update(second.id, password = "rotated".toCharArray())
        assertEquals("rotated", store.records.first { it.id == second.id }.password(FakeSealer()))
        store.remove(second.id)
        assertEquals(1, store.records.size)
        try { store.remove(second.id); fail("Expected not-found rejection") } catch (_: IllegalArgumentException) { }
    }

    @Test fun searchMatchesOriginUsernameTitle() {
        val store = store()
        store.add("https://shop.example.com/", "carol", "p".toCharArray(), "Shopping")
        store.add("https://bank.example.net/", "dan", "p".toCharArray(), "Bank")
        assertEquals(1, store.search("shop").size)
        assertEquals(1, store.search("dan").size)
        assertEquals(2, store.search("").size)
        assertEquals(0, store.search("nomatch").size)
    }

    @Test fun limitsAndSanitization() {
        val store = store()
        try { store.add("https://x.com/", "u", CharArray(0) { 'x' }); fail("Expected empty password rejection") } catch (_: IllegalArgumentException) { }
        try { store.add("https://x.com/", "u", CharArray(2000) { 'x' }); fail("Expected oversize rejection") } catch (_: IllegalArgumentException) { }
        val rec = store.add("https://x.com/", "  bad\u0007name  ", "p".toCharArray(), "\u202efake")
        assertEquals("bad name", rec.username)
        assertFalse(rec.title.contains('\u202e'))
    }
}
