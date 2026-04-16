// ==========================================
// 1. BUTTERY SMOOTH SCROLLING (Lenis)
// ==========================================
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ==========================================
// 2. MOVIE INTRO SEQUENCE
// ==========================================
if (document.getElementById('movie-intro')) {
    lenis.stop(); 
    window.scrollTo(0, 0); 

    const introTl = gsap.timeline({
        onComplete: () => {
            document.getElementById('movie-intro').style.display = 'none';
            lenis.start(); 
        }
    });

    introTl.to(".intro-title", { opacity: 1, y: -10, duration: 1.5, ease: "power2.out", delay: 0.5 })
           .to(".intro-subtitle", { opacity: 1, duration: 1 }, "-=0.5")
           .to(".intro-title", { opacity: 0, y: -20, duration: 1, delay: 0.8 })
           .to(".intro-subtitle", { opacity: 0, duration: 1 }, "-=1")
           .to("#movie-intro", { height: 0, duration: 1.2, ease: "power4.inOut" });
}

// ==========================================
// 3. THREE.JS 3D DATA NETWORK (Parallax)
// ==========================================
const canvas = document.getElementById('webgl-canvas');

if (canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particleCount = window.innerWidth < 768 ? 400 : 1500; 
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color('#00f3ff');
    const color2 = new THREE.Color('#bc13fe');

    for(let i = 0; i < particleCount * 3; i+=3) {
        positions[i] = (Math.random() - 0.5) * 1000;
        positions[i+1] = (Math.random() - 0.5) * 1000;
        positions[i+2] = (Math.random() - 0.5) * 1000;

        const mixedColor = color1.clone().lerp(color2, Math.random());
        colors[i] = mixedColor.r;
        colors[i+1] = mixedColor.g;
        colors[i+2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: window.innerWidth < 768 ? 2 : 3, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    const windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.5;
        mouseY = (event.clientY - windowHalfY) * 0.5;
    });

    const clock = new THREE.Clock();
    function animate3D() {
        requestAnimationFrame(animate3D);
        const elapsedTime = clock.getElapsedTime();
        particles.rotation.y = elapsedTime * 0.05;
        particles.rotation.x = elapsedTime * 0.02;
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
        particles.rotation.y += 0.05 * (targetX - particles.rotation.y);
        particles.rotation.x += 0.05 * (targetY - particles.rotation.x);
        renderer.render(scene, camera);
    }
    animate3D();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ==========================================
// 4. CINEMATIC ANIMATIONS (GSAP)
// ==========================================
gsap.registerPlugin(ScrollTrigger);

if (document.querySelector('.hero-wrapper')) {
    const heroTimeline = gsap.timeline({ scrollTrigger: { trigger: ".hero-wrapper", start: "top top", end: "+=80%", pin: true, scrub: 1 } });
    heroTimeline.to(".hero-content", { scale: 1.1, opacity: 0, filter: "blur(10px)", duration: 1 });
}

gsap.utils.toArray('.gs-reveal').forEach(function(elem) {
    gsap.from(elem, { scrollTrigger: { trigger: elem, start: "top 85%" }, y: 40, opacity: 0, duration: 1, ease: "power3.out" });
});

// ==========================================
// 5. SILENT SCROLL TRACKER
// ==========================================
let scrollMilestones = { 25: false, 50: false, 75: false, 90: false };

window.addEventListener('scroll', () => {
    let scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    
    [25, 50, 75, 90].forEach(milestone => {
        if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
            scrollMilestones[milestone] = true;
            if (typeof gtag === 'function') {
                gtag('event', 'scroll_depth', { 'depth_percentage': milestone });
            }
        }
    });
});

// ==========================================
// 6. PROJECT DATABASE & MODAL LOGIC
// ==========================================
const projectData = {
    project2: {
        sql: `-- EXECUTIVE SUMMARY: Global Layoffs Data Architecture
-- Objective: Clean raw HR data, remove anomalies, and extract longitudinal trends.

-- Highlight 1: Safely Isolating & Removing Duplicates
WITH duplicate_cte AS (
    SELECT *,
    ROW_NUMBER() OVER(
        PARTITION BY company, location, industry, total_laid_off, 
        percentage_laid_off, \`date\`, stage, country, funds_raised_millions
    ) AS row_num
    FROM layoffs_staging
)
DELETE FROM duplicate_cte WHERE row_num > 1;

-- Highlight 2: Calculating Rolling Totals using Window Functions
WITH Rolling_Total AS (
    SELECT SUBSTRING(\`date\`,1,7) AS \`MONTH\`, SUM(total_laid_off) AS total_off
    FROM layoffs_staging2
    WHERE SUBSTRING(\`date\`,1,7) IS NOT NULL
    GROUP BY \`MONTH\`
    ORDER BY 1 ASC
)
SELECT \`MONTH\`, total_off,
    SUM(total_off) OVER(ORDER BY \`MONTH\`) AS rolling_total
FROM Rolling_Total;

-- Highlight 3: Complex CTEs to find Top 5 Layoffs per Year
WITH Company_Year (company, years, total_laid_off) AS (
    SELECT company, YEAR(\`date\`), SUM(total_laid_off)
    FROM layoffs_staging2
    GROUP BY company, YEAR(\`date\`)
), Company_Year_Rank AS (
    SELECT *, DENSE_RANK() OVER (PARTITION BY years ORDER BY total_laid_off DESC) AS Ranking
    FROM Company_Year
    WHERE years IS NOT NULL
)
SELECT * FROM Company_Year_Rank WHERE Ranking <= 5;`,
        
        githubLink: "https://github.com/DIMECULTIVA/KeoDataAnalyst/blob/main/Company%20Layoffs%20Cleaning%20and%20Exploratory%20Project.sql"
    }
};

const modal = document.getElementById('dataModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');

function openModal(tech, projectId) {
    modalTitle.innerText = `${tech.toUpperCase()} - Code & Context`;
    const dataContent = projectData[projectId][tech];
    modalBody.innerText = dataContent;
    modalBody.style.fontFamily = 'monospace';
    modalBody.style.background = '#0a0a0a';

    let footerHTML = `<a href="https://wa.me/27663300304" class="neon-btn primary small" target="_blank">Discuss this data</a>`;
    if (projectData[projectId].githubLink) {
        footerHTML = `<a href="${projectData[projectId].githubLink}" target="_blank" class="neon-btn outline small" style="margin-right: 15px;"><i class="fab fa-github"></i> View Full Architecture</a>` + footerHTML;
    }
    
    modalFooter.innerHTML = footerHTML;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// ==========================================
// 7. AJAX NETLIFY FORM SUBMISSION
// ==========================================
document.querySelectorAll('form[name="contact"]').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        const formData = new FormData(this);
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        
        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;

        fetch('/', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData).toString()
        })
        .then(() => {
            this.style.display = 'none';
            const successMsg = this.nextElementSibling;
            if (successMsg && successMsg.classList.contains('success-message')) {
                successMsg.style.display = 'block';
            }
        })
        .catch((error) => {
            alert('There was an error sending your message. Please reach out on WhatsApp.');
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
    });
});
