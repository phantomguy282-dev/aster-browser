package app.aster.mobile

import org.junit.Assert.*
import org.junit.Test
import java.nio.file.Files

class PolicyTest {
    private fun rejects(block: () -> Unit) {
        try { block(); fail("Expected invalid input to be rejected") }
        catch (_: IllegalArgumentException) { }
    }

    @Test fun modernDomainsAndSearch() {
        for (tld in listOf("wtf", "dev", "app", "ai", "io", "xyz")) {
            assertEquals("https://example.$tld/", NavigationPolicy.resolve("example.$tld"))
        }
        assertEquals("https://xn--bcher-kva.de/", NavigationPolicy.resolve("bücher.de"))
        assertEquals("http://localhost:8080/test?q=1#x", NavigationPolicy.resolve("localhost:8080/test?q=1#x"))
        assertEquals("http://[::1]:8080/", NavigationPolicy.resolve("[::1]:8080"))
        assertEquals("https://www.google.com/search?q=two+words", NavigationPolicy.resolve("two words"))
    }

    @Test fun unsafeSchemesAndCredentialsAreRejected() {
        for (input in listOf("javascript:alert(1)", "file:///secret", "intent://example", "data:text/html,test", "https://user:pass@example.com/", "https://example.com:99999/", "https://bad host/", "https://example.com\\evil")) {
            rejects { NavigationPolicy.webAddress(input) }
        }
        assertFalse(NavigationPolicy.isWebAddress(null))
        assertFalse(NavigationPolicy.secureForPermissions("file://localhost/test"))
        assertTrue(NavigationPolicy.secureForPermissions("https://example.com/"))
        assertFalse(NavigationPolicy.secureForPermissions("http://example.com/"))
    }

    @Test fun fileNamesAreSanitized() {
        assertEquals("_CON.txt", DownloadRisk.safeName("CON.txt"))
        assertEquals("file.txt", DownloadRisk.safeName("../../file.txt"))
        assertEquals("file.txt_stream", DownloadRisk.safeName("file.txt:stream"))
        assertFalse(DownloadRisk.safeName("image\u202Eexe.png").contains('\u202E'))
        assertTrue(DownloadRisk.safeName("x".repeat(400)).length <= 180)
    }

    @Test fun normalFileRemainsUnverifiedEvenWithMatchingHash() {
        val directory = Files.createTempDirectory("aster-policy-").toFile()
        val file = directory.resolve("note.txt")
        file.writeText("hello")
        val hash = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        val report = DownloadRisk.inspect(file, "text/plain", hash)
        assertEquals(hash, report.sha256)
        assertEquals(5L, report.bytes)
        assertEquals(DownloadRisk.Verdict.UNVERIFIED, report.verdict)
        assertFalse(report.malwareScanned)
        assertTrue(report.reasons.any { it.contains("does not establish safety") })
    }

    @Test fun executableAndFormatMismatchAreSuspicious() {
        val directory = Files.createTempDirectory("aster-risk-").toFile()
        val executable = directory.resolve("payload.apk")
        executable.writeBytes(byteArrayOf(0x50, 0x4b, 0x03, 0x04))
        assertEquals(DownloadRisk.Verdict.SUSPICIOUS, DownloadRisk.inspect(executable, "image/png").verdict)
        val disguised = directory.resolve("picture.png")
        disguised.writeText("MZ-not-a-picture")
        val report = DownloadRisk.inspect(disguised, "image/png")
        assertEquals(DownloadRisk.Verdict.SUSPICIOUS, report.verdict)
        assertFalse(report.malwareScanned)
        assertTrue(report.reasons.any { it.contains("executable signature") })
    }

    @Test fun hashMismatchAndInspectionLimitsFailSafely() {
        val file = Files.createTempDirectory("aster-limit-").resolve("note.txt").toFile()
        file.writeText("hello")
        assertEquals(DownloadRisk.Verdict.SUSPICIOUS, DownloadRisk.inspect(file, "text/plain", "0".repeat(64)).verdict)
        rejects { DownloadRisk.inspect(file, "text/plain", "invalid") }
        rejects { DownloadRisk.inspect(file, "text/plain", maxBytes = 2) }
        rejects { DownloadRisk.inspect(file.parentFile.resolve("missing.txt"), null) }
    }
}
