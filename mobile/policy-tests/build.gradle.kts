plugins { kotlin("jvm") version "2.1.20" }
repositories { mavenCentral() }
kotlin { jvmToolchain(21) }
sourceSets {
    main {
        kotlin.srcDir("../android/app/src/main/java")
        kotlin.include("**/NavigationPolicy.kt", "**/DownloadRisk.kt", "**/MobileShield.kt", "**/PasswordStore.kt")
    }
}
dependencies { testImplementation("junit:junit:4.13.2") }
tasks.test { useJUnit(); testLogging { events("passed", "failed", "skipped") } }

