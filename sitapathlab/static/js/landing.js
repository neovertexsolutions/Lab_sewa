/* =====================================================
   LOGIN MODAL
===================================================== */

function openLogin() {

    const modal =
        document.getElementById("loginModal");

    if (!modal) return;

    modal.classList.add("show");

    document.body.style.overflow = "hidden";

}


function closeLogin() {

    const modal =
        document.getElementById("loginModal");

    if (!modal) return;

    modal.classList.remove("show");

    document.body.style.overflow = "";

}


/* =====================================================
   CLOSE ON BACKDROP
===================================================== */

document.addEventListener("click", function (event) {

    const modal =
        document.getElementById("loginModal");

    if (!modal) return;

    if (event.target === modal) {
        closeLogin();
    }

});


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closeLogin();
    }

});


/* =====================================================
   MOBILE MENU
===================================================== */

function toggleMenu() {

    const nav =
        document.querySelector(".nav-links");

    if (!nav) return;

    nav.classList.toggle("mobile-open");

}


/* =====================================================
   SCROLL REVEAL
===================================================== */

const revealElements =
    document.querySelectorAll(
        ".feature-card, .security-container, .cta-box"
    );


const revealObserver =
    new IntersectionObserver(
        (entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.style.opacity = "1";

                    entry.target.style.transform =
                        "translateY(0)";

                }

            });

        },
        {
            threshold: 0.12
        }
    );


revealElements.forEach(element => {

    element.style.opacity = "0";

    element.style.transform =
        "translateY(25px)";

    element.style.transition =
        "opacity .7s ease, transform .7s ease";

    revealObserver.observe(element);

});