document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("waveCanvas");
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
        canvas.width = 100;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

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

    let time = 0;
    let isScrolling = false;
    let scrollTimeout;
    let animationFrameId = null;
    let scrollSpeed = 0;
    let isAtPageBottom = false;
    const MAX_SCROLL_SPEED = 0.2;
    const SCROLL_DECAY = 0.95;
    const AUTO_ANIMATION_SPEED = 0.03;

    let isFirstLoad = true;
    let firstLoadProgress = 0;
    const FIRST_LOAD_SPEED = 0.005;

    function drawWave(wave, index) {
        ctx.beginPath();
        ctx.lineWidth = wave.width;
        ctx.strokeStyle = wave.color;

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
        const safeWidth = canvas.width * 0.9;
        const safeAmplitude = (safeWidth / 2) * 0.8;

        const scaledAmplitude = Math.min(wave.amplitude, safeAmplitude);
        const startY = -100;
        const endY = canvas.height + 100;

        const currentEndY = isFirstLoad ? startY + (endY - startY) * firstLoadProgress : endY;

        ctx.moveTo(baseX, startY);

        for (let y = startY; y < currentEndY; y += 5) {
            const waveOffset = (index - 2) * 4;

            const x =
                baseX +
                waveOffset +
                scaledAmplitude * Math.sin(y * wave.frequency + time * wave.speed + wave.offset) +
                scaledAmplitude * 0.4 * Math.sin(y * wave.frequency * 2 + time * wave.speed * 1.5 + wave.offset) +
                scaledAmplitude * 0.2 * Math.cos(y * wave.frequency * 1.8 + time * wave.speed * 0.7 + wave.offset);

            ctx.lineTo(x, y);
        }

        ctx.stroke();

        if (!isFirstLoad || canvas.height - 5 <= currentEndY) {
            const visibleEndY = canvas.height - 5;

            const waveOffset = (index - 2) * 4;
            const bottomX =
                baseX +
                waveOffset +
                scaledAmplitude * Math.sin(visibleEndY * wave.frequency + time * wave.speed + wave.offset) +
                scaledAmplitude * 0.4 * Math.sin(visibleEndY * wave.frequency * 2 + time * wave.speed * 1.5 + wave.offset) +
                scaledAmplitude * 0.2 * Math.cos(visibleEndY * wave.frequency * 1.8 + time * wave.speed * 0.7 + wave.offset);

            const sphereRadius = wave.width * 2;

            ctx.beginPath();
            ctx.fillStyle = wave.color;
            ctx.arc(bottomX, visibleEndY, sphereRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        if (isFirstLoad && currentEndY > 0) {
            const waveOffset = (index - 2) * 4;
            const currentX =
                baseX +
                waveOffset +
                scaledAmplitude * Math.sin(currentEndY * wave.frequency + time * wave.speed + wave.offset) +
                scaledAmplitude * 0.4 * Math.sin(currentEndY * wave.frequency * 2 + time * wave.speed * 1.5 + wave.offset) +
                scaledAmplitude * 0.2 * Math.cos(currentEndY * wave.frequency * 1.8 + time * wave.speed * 0.7 + wave.offset);

            const sphereRadius = wave.width * 2;

            ctx.beginPath();
            ctx.fillStyle = wave.color;
            ctx.arc(currentX, currentEndY, sphereRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        waveLines.forEach((wave, index) => drawWave(wave, index));

        if (isFirstLoad) {
            firstLoadProgress += FIRST_LOAD_SPEED;

            if (firstLoadProgress >= 1) {
                isFirstLoad = false;

                checkIfAtBottom();
            }

            time += AUTO_ANIMATION_SPEED * 0.05;
            animationFrameId = requestAnimationFrame(animate);
        } else if (isScrolling || scrollSpeed > 0.001) {
            time += scrollSpeed;
            scrollSpeed *= SCROLL_DECAY;
            animationFrameId = requestAnimationFrame(animate);
        } else if (isAtPageBottom) {
            time += AUTO_ANIMATION_SPEED;
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null;
        }
    }

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

        isAtPageBottom = scrollPosition + windowHeight >= documentHeight - 50;

        if (isAtPageBottom && !animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    window.addEventListener("scroll", function () {
        checkIfAtBottom();
    });

    checkIfAtBottom();

    window.addEventListener("wheel", function (event) {
        const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

        isScrolling = true;

        scrollSpeed = Math.sign(delta) * Math.min(Math.abs(delta) / 100, 1) * MAX_SCROLL_SPEED;

        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(function () {
            isScrolling = false;
        }, 150);

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    });

    animationFrameId = requestAnimationFrame(animate);
});
