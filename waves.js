document.addEventListener("DOMContentLoaded", function () {
    // Constants
    const MAX_SCROLL_SPEED = 0.2;
    const SCROLL_DECAY = 0.95;
    const AUTO_ANIMATION_SPEED = 0.03;
    const FIRST_LOAD_SPEED = 0.005;
    const NORMAL_BOTTOM_GAP = 20;
    const BOTTOM_GAP_AT_BOTTOM = 5;
    const GAP_TRANSITION_SPEED = 0.1;

    // Canvas Setup
    const canvas = document.getElementById("waveCanvas");
    const ctx = canvas.getContext("2d", { alpha: true });

    // Wave Configuration
    const waveLines = [
        { color: "rgba(255, 255, 255, 0.9)", amplitude: 20, frequency: 0.03, speed: 0.2, offset: 0, width: 2.5 },
        { color: "rgba(180, 220, 255, 0.8)", amplitude: 22, frequency: 0.025, speed: 0.18, offset: 2, width: 2.0 },
        {
            color: "rgba(57, 197, 187, 0.9)",
            amplitude: 25,
            frequency: 0.02,
            speed: 0.25,
            offset: 4,
            width: 2.8,
            shadowBlur: 25,
            extraGlow: true,
        },
        { color: "rgba(200, 200, 255, 0.85)", amplitude: 23, frequency: 0.022, speed: 0.22, offset: 6, width: 2.2 },
        { color: "rgba(255, 240, 180, 0.9)", amplitude: 24, frequency: 0.024, speed: 0.21, offset: 8, width: 2.5 },
    ];

    // State Variables
    let time = 0;
    let isScrolling = false;
    let scrollTimeout;
    let animationFrameId = null;
    let scrollSpeed = 0;
    let isAtPageBottom = false;
    let isFirstLoad = true;
    let firstLoadProgress = 0;
    let currentBottomGap = NORMAL_BOTTOM_GAP;
    let lastScrollPosition = window.scrollY || window.pageYOffset;

    // Helper Functions
    function resizeCanvas() {
        canvas.width = 100; // Keep canvas narrow for vertical waves
        canvas.height = window.innerHeight;
    }

    function parseColor(colorStr) {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] ? parseFloat(match[4]) : 1,
            };
        }
        return { r: 255, g: 255, b: 255, a: 1 }; // Default color
    }

    // Core Drawing Function
    function drawWave(wave, index) {
        const waveBottomOffset = wave.bottomOffset || 0;

        if (wave.extraGlow) {
            ctx.shadowBlur = wave.shadowBlur || 20;
            ctx.shadowColor = wave.color;
            ctx.filter = "blur(0.8px) brightness(1.3)";
        } else {
            ctx.shadowBlur = 15;
            ctx.shadowColor = wave.color;
            ctx.filter = "blur(0.5px) brightness(1.2)";
        }

        const baseX = canvas.width / 2;
        const safeWidth = canvas.width * 0.9; // Ensure wave stays within canvas bounds
        const safeAmplitude = (safeWidth / 2) * 0.8;
        const adjustedAmplitude = Math.min(wave.amplitude, safeAmplitude);

        const startY = -100; // Start drawing above the viewport

        const waveVariation = Math.sin(time * 0.2 + index * 1.1) * 5; // Subtle vertical bobbing
        const endY = canvas.height - currentBottomGap + waveBottomOffset + waveVariation;
        const endMargin = 20 + Math.cos(index * 1.3) * 10; // Varied margin at the bottom of each wave

        const visibleEndY = isFirstLoad ? startY + (endY - startY) * firstLoadProgress : endY - endMargin;

        const totalWaves = waveLines.length;
        const waveHorizontalOffset = (index - totalWaves / 2) * 3; // Spread waves horizontally

        const primaryTimeOffset = time * wave.speed + wave.offset;
        const secondaryTimeOffset = time * wave.speed * 1.5 + wave.offset; // Additional harmonic
        const tertiaryTimeOffset = time * wave.speed * 0.7 + wave.offset; // Another harmonic

        ctx.fillStyle = wave.color;
        ctx.beginPath();

        const dotSpacing = Math.max(2, Math.min(5, canvas.height / 400)); // Dynamic dot spacing
        const baseRadius = wave.width / 1.5;

        // Draw the main body of the wave with dots
        for (let currentY = startY; currentY < visibleEndY - 15; currentY += dotSpacing) {
            const wavePhase = currentY * wave.frequency;
            const microOscillation = Math.sin(currentY * 0.1 + time * 0.3) * 2; // Small side-to-side movement

            const x =
                baseX +
                waveHorizontalOffset +
                adjustedAmplitude *
                    (Math.sin(wavePhase + primaryTimeOffset) +
                        0.4 * Math.sin(wavePhase * 2 + secondaryTimeOffset) +
                        0.2 * Math.cos(wavePhase * 1.8 + tertiaryTimeOffset) +
                        0.1 * Math.sin(wavePhase * 3.2 + time * 0.15)) + // Fourth harmonic for complexity
                microOscillation;

            ctx.moveTo(x + baseRadius, currentY);
            ctx.arc(x, currentY, baseRadius, 0, Math.PI * 2);
        }
        ctx.fill();

        // Draw the glowing sphere at the end of the wave
        ctx.beginPath();
        ctx.shadowBlur = wave.sphereGlow;
        ctx.shadowColor = wave.color;

        const standardSphereRadius = 6;
        const sphereY = Math.min(visibleEndY - 10, canvas.height - wave.sphereRadius - 5);
        const sphereWavePhase = sphereY * wave.frequency;
        const sphereMicroOscillation = Math.sin(sphereY * 0.1 + time * 0.3) * 2;

        const sphereX =
            baseX +
            waveHorizontalOffset +
            adjustedAmplitude *
                (Math.sin(sphereWavePhase + primaryTimeOffset) +
                    0.4 * Math.sin(sphereWavePhase * 2 + secondaryTimeOffset) +
                    0.2 * Math.cos(sphereWavePhase * 1.8 + tertiaryTimeOffset) +
                    0.1 * Math.sin(sphereWavePhase * 3.2 + time * 0.15)) +
            sphereMicroOscillation;

        const gradient = ctx.createRadialGradient(sphereX, sphereY, 0, sphereX, sphereY, standardSphereRadius);

        const colorObj = parseColor(wave.color);
        gradient.addColorStop(0, `rgba(${Math.min(255, colorObj.r + 50)}, ${Math.min(255, colorObj.g + 50)}, ${Math.min(255, colorObj.b + 50)}, ${colorObj.a})`);
        gradient.addColorStop(0.7, wave.color);
        gradient.addColorStop(1, `rgba(${Math.max(0, colorObj.r - 20)}, ${Math.max(0, colorObj.g - 20)}, ${Math.max(0, colorObj.b - 20)}, ${colorObj.a})`);

        ctx.fillStyle = gradient;
        ctx.arc(sphereX, sphereY, standardSphereRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add a small highlight to the sphere
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.arc(sphereX - standardSphereRadius * 0.3, sphereY - standardSphereRadius * 0.3, standardSphereRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update sphere positions for potential external use (e.g., debugging)
        const baseSpherePosY = canvas.height - 200;
        const sphereSpacing = 10;
        window.spherePositions = waveLines.map((wave, idx) => baseSpherePosY + idx * sphereSpacing);

        // Smoothly transition the bottom gap of the waves
        const targetGap = isAtPageBottom ? BOTTOM_GAP_AT_BOTTOM : NORMAL_BOTTOM_GAP;
        if (Math.abs(currentBottomGap - targetGap) > 0.1) {
            currentBottomGap += (targetGap - currentBottomGap) * GAP_TRANSITION_SPEED;
        } else {
            currentBottomGap = targetGap;
        }

        // Draw waves from back to front
        for (let i = waveLines.length - 1; i >= 0; i--) {
            drawWave(waveLines[i], i);
        }

        // Animation logic based on state
        if (isFirstLoad) {
            firstLoadProgress += FIRST_LOAD_SPEED;
            if (firstLoadProgress >= 1) {
                isFirstLoad = false;
                firstLoadProgress = 1; // Cap progress
                checkIfAtBottom(); // Check state once loading is complete
            }
            time += AUTO_ANIMATION_SPEED * 0.05; // Slower animation during initial load
            animationFrameId = requestAnimationFrame(animate);
        } else if (isScrolling || scrollSpeed > 0.001) {
            time += scrollSpeed;
            scrollSpeed *= SCROLL_DECAY; // Gradually reduce scroll-induced animation speed
            animationFrameId = requestAnimationFrame(animate);
        } else if (isAtPageBottom) {
            time += AUTO_ANIMATION_SPEED; // Gentle animation when at the bottom of the page
            animationFrameId = requestAnimationFrame(animate);
        } else if (Math.abs(currentBottomGap - targetGap) > 0.1) {
            // Continue animation if the bottom gap is still transitioning
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null; // Stop animation if no activity
        }
    }

    // State Management Functions
    function checkIfAtBottom() {
        const scrollPosition = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );

        const previouslyAtBottom = isAtPageBottom;
        isAtPageBottom = scrollPosition + windowHeight >= documentHeight - 50; // Threshold for being "at bottom"

        if (isAtPageBottom && !animationFrameId) {
            // If now at bottom and animation was stopped, restart it
            animationFrameId = requestAnimationFrame(animate);
        } else if (!isAtPageBottom && previouslyAtBottom && !isScrolling && scrollSpeed <= 0.001) {
            // If scrolled away from bottom and not otherwise animating, stop animation
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    }

    function updateBottomGap() {
        // This function ensures the animation runs if the gap needs to change.
        // The actual gap update happens within the animate() function.
        const targetGap = isAtPageBottom ? BOTTOM_GAP_AT_BOTTOM : NORMAL_BOTTOM_GAP;
        if (Math.abs(currentBottomGap - targetGap) > 0.1 && !animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    // Event Handlers
    function handleScroll() {
        const currentScrollPosition = window.scrollY || window.pageYOffset;
        const scrollDelta = currentScrollPosition - lastScrollPosition;

        if (Math.abs(scrollDelta) > 0) {
            isScrolling = true;
            // Scale scroll speed, ensuring it's capped
            scrollSpeed = Math.sign(scrollDelta) * Math.min(Math.abs(scrollDelta) / 20, 1) * MAX_SCROLL_SPEED;

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(animate);
            }

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () {
                isScrolling = false;
                // If not at page bottom and animation is only due to scroll, stop it.
                // checkIfAtBottom will handle if it should continue for other reasons.
                checkIfAtBottom();
                if (!isAtPageBottom && !animationFrameId && scrollSpeed <= 0.001 && Math.abs(currentBottomGap - (isAtPageBottom ? BOTTOM_GAP_AT_BOTTOM : NORMAL_BOTTOM_GAP)) <= 0.1) {
                    // Condition to stop if no other reason to animate
                }
            }, 150);
        }

        checkIfAtBottom();
        lastScrollPosition = currentScrollPosition;
    }

    function handleWheel(event) {
        const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

        isScrolling = true;
        scrollSpeed = Math.sign(delta) * Math.min(Math.abs(delta) / 100, 1) * MAX_SCROLL_SPEED;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            checkIfAtBottom(); // Check if animation should continue or stop
        }, 150);

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    // Initialization
    resizeCanvas();

    waveLines.forEach((wave, index) => {
        wave.bottomOffset = Math.sin(index * 1.5) * 8; // Slight vertical offset for each wave end
        wave.sphereRadius = wave.width * 3; // Base radius for sphere, actual is fixed now
        wave.sphereGlow = wave.extraGlow ? 30 : 20; // Glow intensity for the sphere
    });

    checkIfAtBottom();
    updateBottomGap(); // Initial check for bottom gap adjustment

    // Attach Event Listeners
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("wheel", handleWheel);

    // Start Animation
    animationFrameId = requestAnimationFrame(animate);
});
