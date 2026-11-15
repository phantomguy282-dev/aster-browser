plugins { kotlin("jvm") version "2.1.20" }
repositories { mavenCentral() }
kotlin { jvmToolchain(21) }
sourceSets.main { kotlin.srcDir("../android/app/src/main/java") }
dependencies { compileOnly("org.robolectric:android-all:15-robolectric-12650502") }
// Syntax/API checking only: this does not run Android, package resources, or produce an APK.
