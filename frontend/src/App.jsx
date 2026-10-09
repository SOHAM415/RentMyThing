import React, { useEffect, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  askAI,
  cancelBooking,
  createBooking,
  createItem,
  createPaymentOrder,
  deleteItem,
  getBookings,
  getItem,
  getOwnerBookings,
  getMyItems,
  getBookingRoom,
  getBookingMessages,
  sendBookingMessage,
  updateBookingHandoff,
  verifyBookingHandoff,
  listItems,
  login,
  register,
  updateItem,
  verifyPayment,
  getItemReviews,
  createItemReview,
} from "./api";

const ITEMS_PER_PAGE = 5;


/* =========================
   LAYOUT
========================= */

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  });

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("token"));

    try {
      setUser(
        JSON.parse(
          localStorage.getItem("user") || "null"
        )
      );
    } catch {
      setUser(null);
    }
  }, [location.pathname]);

  // Scroll to the top whenever the user changes pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setProfileOpen(false);

    navigate("/");
  }

  const displayName =
    user?.name || "Account";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="nav">
        <Link className="brand" to="/">
          Rent<span>MyThing</span>
        </Link>

        <nav>
          <Link to="/items">
            Explore
          </Link>

          {token && (
            <Link to="/bookings">
              My Bookings
            </Link>
          )}

          {token && (
            <Link to="/owner">
              Owner Dashboard
            </Link>
          )}

          {!token && (
            <>
              <Link to="/login">
                Login
              </Link>

              <Link
                className="navSignup"
                to="/register"
              >
                Sign Up
              </Link>
            </>
          )}

          {token && (
            <div className="profileMenu">
              <button
                className="profileButton"
                onClick={() =>
                  setProfileOpen(!profileOpen)
                }
              >
                <span className="profileAvatar">
                  {initials}
                </span>

                <span className="profileName">
                  {displayName}
                </span>

                <span className="profileArrow">
                  {profileOpen ? "▲" : "▼"}
                </span>
              </button>

              {profileOpen && (
                <div className="profileDropdown">
                  <div className="profileHeader">
                    <div className="profileAvatar large">
                      {initials}
                    </div>

                    <div>
                      <strong>
                        {user?.name || "User"}
                      </strong>

                      <span>
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>

                  <div className="profileDivider" />

                  <Link
                    to="/bookings"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                  >
                    My Bookings
                  </Link>

                  <Link
                    to="/owner"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                  >
                    Owner Dashboard
                  </Link>

                  <button
                    className="profileLogout"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <Link
        className="aiBubble"
        to="/ai"
      >
        🤖 AI Assistant
      </Link>
    </>
  );
}


/* =========================
   HOME
========================= */

function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listItems({ limit: 3 })
      .then((d) => {
        setFeatured(d.items || []);
      })
      .catch(() => {
        setFeatured([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loggedIn = !!localStorage.getItem("token");

  return (
    <div className="home">

      {/* =========================
          HERO
      ========================= */}

      <section className="homeHero">
        <div className="homeHeroContent">
          <p className="eyebrow">
            AI-powered rental marketplace
          </p>

          <h1>
            Rent what you need.
            <br />
            <span>When you need it.</span>
          </h1>

          <p className="homeLead">
            Discover useful items from people around you,
            compare real listings, book securely, and let
            RentMyThing AI help you find the right rental.
          </p>

          <div className="actions">
            <Link
              className="primary"
              to="/items"
            >
              Explore rentals
            </Link>

            <Link
              className="secondary"
              to={loggedIn ? "/owner" : "/register"}
            >
              {loggedIn
                ? "Manage your listings"
                : "Start renting"}
            </Link>
          </div>

          <div className="homeHighlights">
            <div>
              <strong>Real listings</strong>
              <span>From actual users</span>
            </div>

            <div>
              <strong>Secure booking</strong>
              <span>Razorpay powered</span>
            </div>

            <div>
              <strong>AI assistance</strong>
              <span>Find rentals faster</span>
            </div>
          </div>
        </div>

        <div className="heroVisual">
          <div className="heroVisualTop">
            <span className="liveDot"></span>
            Live marketplace
          </div>

          <div className="heroVisualMain">
            <p className="heroVisualLabel">
              RENT SOMETHING YOU NEED
            </p>

            <h3>
              One place.
              <br />
              Every useful rental.
            </h3>

            <div className="heroMiniItems">
              <div className="heroMiniItem">
                <div className="heroMiniIcon">📷</div>
                <div>
                  <strong>Cameras</strong>
                  <span>For events & projects</span>
                </div>
              </div>

              <div className="heroMiniItem">
                <div className="heroMiniIcon">⌚</div>
                <div>
                  <strong>Watches</strong>
                  <span>For occasions & style</span>
                </div>
              </div>

              <div className="heroMiniItem">
                <div className="heroMiniIcon">＋</div>
                <div>
                  <strong>More items</strong>
                  <span>Explore the marketplace</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =========================
          FEATURED RENTALS
      ========================= */}

      <section className="homeSection">
        <div className="homeSectionHead">
          <div>
            <p className="eyebrow">
              Marketplace
            </p>

            <h2>
              Featured rentals
            </h2>

            <p>
              See what people are currently listing
              on RentMyThing.
            </p>
          </div>

          <Link
            className="textLink"
            to="/items"
          >
            View all rentals →
          </Link>
        </div>

        {loading ? (
          <p className="homeLoading">
            Loading rentals...
          </p>
        ) : featured.length === 0 ? (
          <div className="emptyHome">
            <h3>No rentals listed yet</h3>
            <p>
              Be the first to add something to
              RentMyThing.
            </p>

            <Link
              className="primary"
              to={loggedIn ? "/owner" : "/register"}
            >
              Start listing
            </Link>
          </div>
        ) : (
          <div className="featuredGrid">
            {featured.map((item) => (
              <Link
                className="featuredCard"
                key={item.id}
                to={`/items/${item.id}`}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                  />
                ) : (
                  <div className="featuredPlaceholder">
                    No image
                  </div>
                )}

                <div className="featuredBody">
                  <p className="featuredCategory">
                    {item.category || "Rental"}
                  </p>

                  <h3>{item.title}</h3>

                  <p className="featuredLocation">
                    {item.city || "Location unavailable"}
                  </p>

                  <div className="featuredBottom">
                    <strong>
                      ₹{item.price_per_day}/day
                    </strong>

                    <span>
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>


      {/* =========================
          HOW IT WORKS
      ========================= */}

      <section className="homeSection homeLight">
        <div className="homeSectionCenter">
          <p className="eyebrow">
            Simple process
          </p>

          <h2>
            How RentMyThing works
          </h2>

          <p>
            From discovery to booking, everything
            happens in a simple flow.
          </p>
        </div>

        <div className="stepsGrid">
          <div className="stepCard">
            <div className="stepNumber">
              01
            </div>

            <h3>
              Explore
            </h3>

            <p>
              Browse real rental listings and find
              something that fits your needs.
            </p>
          </div>

          <div className="stepCard">
            <div className="stepNumber">
              02
            </div>

            <h3>
              Choose your dates
            </h3>

            <p>
              Open the item, select your rental
              dates, and check the available period.
            </p>
          </div>

          <div className="stepCard">
            <div className="stepNumber">
              03
            </div>

            <h3>
              Book & pay
            </h3>

            <p>
              Complete the Razorpay checkout and
              your confirmed booking appears in
              My Bookings.
            </p>
          </div>
        </div>
      </section>


      {/* =========================
          WHY RENTMYTHING
      ========================= */}

      <section className="homeSection">
        <div className="homeSectionCenter">
          <p className="eyebrow">
            Why RentMyThing
          </p>

          <h2>
            More than just a rental marketplace
          </h2>

          <p>
            Built to make finding and renting useful
            things simpler.
          </p>
        </div>

        <div className="benefitsGrid">
          <div className="benefitCard">
            <div className="benefitIcon">
              AI
            </div>

            <h3>
              AI rental assistant
            </h3>

            <p>
              Ask naturally about rentals, prices,
              categories, and available listings.
            </p>
          </div>

          <div className="benefitCard">
            <div className="benefitIcon">
              ₹
            </div>

            <h3>
              Transparent pricing
            </h3>

            <p>
              See the daily rental price directly
              on the listing before booking.
            </p>
          </div>

          <div className="benefitCard">
            <div className="benefitIcon">
              ✓
            </div>

            <h3>
              Secure booking
            </h3>

            <p>
              Select your dates and complete payment
              through the integrated checkout flow.
            </p>
          </div>
        </div>
      </section>


      {/* =========================
          FINAL CTA
      ========================= */}

      <section className="homeCTA">
        <div>
          <p className="eyebrow">
            Ready to explore?
          </p>

          <h2>
            Find something useful today.
          </h2>

          <p>
            Browse the marketplace or let the AI
            assistant help you find a rental.
          </p>
        </div>

        <div className="actions">
          <Link
            className="primary"
            to="/items"
          >
            Explore rentals
          </Link>

          <Link
            className="secondary"
            to="/ai"
          >
            Ask AI Assistant
          </Link>
        </div>
      </section>

    </div>
  );
}


/* =========================
   MARKETPLACE
========================= */

function Items() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listItems({ page: 1, limit: ITEMS_PER_PAGE })
      .then((data) => {
        if (cancelled) return;
        const firstPage = Array.isArray(data.items) ? data.items : [];
        setItems(firstPage);
        setPage(1);
        setHasMore(firstPage.length === ITEMS_PER_PAGE);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMoreItems() {
    if (loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setLoadMoreError("");

    try {
      const data = await listItems({ page: nextPage, limit: ITEMS_PER_PAGE });
      const nextItems = Array.isArray(data.items) ? data.items : [];

      setItems((currentItems) => {
        const knownIds = new Set(currentItems.map((item) => item.id));
        const uniqueNextItems = nextItems.filter((item) => {
          if (knownIds.has(item.id)) return false;
          knownIds.add(item.id);
          return true;
        });
        return [...currentItems, ...uniqueNextItems];
      });

      setPage(nextPage);
      setHasMore(nextItems.length === ITEMS_PER_PAGE);
    } catch {
      setLoadMoreError("Couldn't load more rentals. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  const filtered = items.filter((i) =>
    `${i.title} ${i.description || ""} ${i.category || ""} ${i.city || ""}`
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <section className="page">
      <div className="sectionHead">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h2>Explore rentals</h2>
        </div>

        <input
          className="search"
          placeholder="Search cameras, laptops, bikes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading rentals...</p>
      ) : (
        <>
          {filtered.length === 0 ? (
            <p>{items.length === 0 ? "No rentals available yet." : "No rentals match your search."}</p>
          ) : (
            <div className="grid">
              {filtered.map((item) => (
                <Link
                  className="card"
                  key={item.id}
                  to={`/items/${item.id}`}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} />
                  ) : (
                    <div className="placeholder">No image</div>
                  )}

                  <div className="cardBody">
                    <h3>{item.title}</h3>
                    <p>{item.description?.slice(0, 90)}</p>
                    <strong>₹{item.price_per_day}/day</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button
                type="button"
                className="primary"
                onClick={loadMoreItems}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more rentals"}
              </button>
            </div>
          )}

          {loadMoreError && (
            <p role="alert" style={{ textAlign: "center", marginTop: 12 }}>
              {loadMoreError}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/* =========================
   ITEM DETAILS
========================= */

function ItemDetails() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewAverage, setReviewAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    getItem(id)
      .then(setItem)
      .catch((e) =>
        setMsg(
          e.response?.data?.message ||
            "Unable to load item"
        )
      );

    getItemReviews(id)
      .then((data) => {
        setReviews(data.reviews || []);
        setReviewAverage(
          Number(data.average) || 0
        );
        setReviewCount(
          Number(data.count) || 0
        );
      })
      .catch(() => {
        setReviews([]);
        setReviewAverage(0);
        setReviewCount(0);
      });
  }, [id]);

  useEffect(() => {
    let storedUser = null;

    try {
      storedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      storedUser = null;
    }

    if (!storedUser?.id) {
      setHasReviewed(false);
      return;
    }

    const reviewKey =
      `rentmything_reviewed_${storedUser.id}_${id}`;

    setHasReviewed(
      localStorage.getItem(reviewKey) === "true"
    );
  }, [id]);

  async function submitReview(e) {
    e.preventDefault();

    if (!localStorage.getItem("token")) {
      setReviewMsg(
        "Please login to leave a review."
      );
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMsg(
        "Please write a comment before submitting."
      );
      return;
    }

    try {
      await createItemReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

     setReviewComment("");
setReviewRating(5);
setReviewMsg(
  "Review submitted successfully."
);

const storedUser = JSON.parse(
  localStorage.getItem("user") || "null"
);

if (storedUser?.id) {
  const reviewKey =
    `rentmything_reviewed_${storedUser.id}_${id}`;

  localStorage.setItem(
    reviewKey,
    "true"
  );

  setHasReviewed(true);
}
      const updated =
        await getItemReviews(id);

      setReviews(
        updated.reviews || []
      );

      setReviewAverage(
        Number(updated.average) || 0
      );

      setReviewCount(
        Number(updated.count) || 0
      );
    } catch (error) {
      setReviewMsg(
        error.response?.data?.message ||
          "Unable to submit review."
      );
    }
  }

  async function book() {
    if (!localStorage.getItem("token")) {
      setMsg(
        "Please login before booking."
      );
      return;
    }

    if (!start || !end) {
      setMsg("Select rental dates.");
      return;
    }

    try {
      const booking = await createBooking({
        item_id: Number(id),
        start_date: start,
        end_date: end,
      });

      const bookingId =
        booking.booking?.id;

      if (!bookingId) {
        throw new Error(
          "Booking ID missing"
        );
      }

      const order =
        await createPaymentOrder(
          bookingId
        );

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay checkout is unavailable"
        );
      }

      const rzp =
        new window.Razorpay({
          key:
            import.meta.env
              .VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency:
            order.currency || "INR",
          order_id: order.id,
          name: "RentMyThing",
          description: item.title,

          handler: async (response) => {
            await verifyPayment(
              response
            );

            setMsg(
              "Payment successful — booking confirmed."
            );
          },
        });

      rzp.open();
    } catch (e) {
      setMsg(
        e.response?.data?.message ||
          e.message ||
          "Booking failed"
      );
    }
  }

  if (!item) {
    return (
      <section className="page">
        <p>
          {msg || "Loading..."}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="page detail">
        <div className="detailImage">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
            />
          ) : (
            "No image"
          )}
        </div>

        <div>
          <p className="eyebrow">
            Rental item
          </p>

          <h2>{item.title}</h2>

          <p className="lead">
            {item.description}
          </p>

          <h3>
            ₹{item.price_per_day}/day
          </h3>

          <div className="dateRow">
            <label>
              Start
              <input
                type="date"
                value={start}
                onChange={(e) =>
                  setStart(e.target.value)
                }
              />
            </label>

            <label>
              End
              <input
                type="date"
                value={end}
                onChange={(e) =>
                  setEnd(e.target.value)
                }
              />
            </label>
          </div>

          <button
            className="primary"
            onClick={book}
          >
            Book & Pay
          </button>

          {msg && (
            <p className="notice">
              {msg}
            </p>
          )}
        </div>
      </section>

      {/* =========================
          REVIEWS
      ========================= */}

      <section className="reviewsSection">
        <div className="reviewsHeader">
          <div>
            <p className="eyebrow">
              Customer reviews
            </p>

            <h2>
              {reviewAverage > 0
                ? `${reviewAverage.toFixed(1)} / 5`
                : "No ratings yet"}
            </h2>

            <p>
              {reviewCount}{" "}
              {reviewCount === 1
                ? "review"
                : "reviews"}
            </p>
          </div>

          {reviewAverage > 0 && (
            <div className="reviewStars">
              {"★".repeat(
                Math.round(reviewAverage)
              )}
              {"☆".repeat(
                5 -
                  Math.round(
                    reviewAverage
                  )
              )}
            </div>
          )}
        </div>

        <div className="reviewList">
          {reviews.length === 0 ? (
            <div className="reviewEmpty">
              <p>
                No reviews yet. Be the first
                to review this rental.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                className="reviewCard"
                key={review.id}
              >
                <div className="reviewTop">
                  <strong>
                    {review.user_name}
                  </strong>

                  <span className="reviewStars small">
                    {"★".repeat(
                      review.rating
                    )}
                    {"☆".repeat(
                      5 - review.rating
                    )}
                  </span>
                </div>

                {review.comment && (
                  <p>
                    {review.comment}
                  </p>
                )}

                <small>
                  {new Date(
                    review.created_at
                  ).toLocaleDateString()}
                </small>
              </div>
            ))
          )}
        </div>

        {hasReviewed ? (
  <div className="reviewAlreadySubmitted">
    <strong>
      ✓ You already reviewed this item
    </strong>

    <p>
      Thanks for sharing your experience.
    </p>
  </div>
) : (
  <form
    className="reviewForm"
    onSubmit={submitReview}
  >
    <h3>
      Leave a review
    </h3>

    <label>
      Rating

      <select
        value={reviewRating}
        onChange={(e) =>
          setReviewRating(
            Number(e.target.value)
          )
        }
      >
        <option value={5}>
          5 — Excellent
        </option>

        <option value={4}>
          4 — Good
        </option>

        <option value={3}>
          3 — Average
        </option>

        <option value={2}>
          2 — Poor
        </option>

        <option value={1}>
          1 — Very poor
        </option>
      </select>
    </label>

    <label>
      Comment

      <textarea
        value={reviewComment}
        onChange={(e) =>
          setReviewComment(
            e.target.value
          )
        }
        placeholder="How was your rental experience?"
        rows="4"
      />
    </label>

    <button
      className="primary"
      type="submit"
    >
      Submit Review
    </button>

    {reviewMsg && (
      <p className="notice">
        {reviewMsg}
      </p>
    )}
  </form>
)}
      </section>
    </>
  );
}


/* =========================
   AUTH
========================= */

function Auth({ mode }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();

    try {
      const d =
        mode === "login"
          ? await login({
              email: form.email,
              password: form.password,
            })
          : await register(form);

      if (d.token) {
  localStorage.setItem("token", d.token);
}

if (d.user) {
  localStorage.setItem(
    "user",
    JSON.stringify(d.user)
  );
}

      nav("/items");
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          "Request failed"
      );
    }
  }

  return (
    <section className="auth">
      <form className="panel" onSubmit={submit}>
        <p className="eyebrow">
          {mode === "login"
            ? "Welcome back"
            : "Create your account"}
        </p>

        <h2>
          {mode === "login" ? "Login" : "Register"}
        </h2>

        {mode !== "login" && (
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        )}

        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <input
          required
          minLength="6"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        <button className="primary">
          Continue
        </button>

        {msg && <p className="notice">{msg}</p>}
      </form>
    </section>
  );
}


/* =========================
   BOOKINGS
========================= */

function Bookings() {
  const [data, setData] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getBookings()
      .then((d) => setData(d.bookings || []))
      .catch((e) =>
        setMsg(
          e.response?.data?.message ||
            "Login required"
        )
      );
  }, []);

  async function cancel(id) {
    try {
      await cancelBooking(id);

      const d = await getBookings();
      setData(d.bookings || []);
    } catch (e) {
      setMsg(
        e.response?.data?.message ||
          "Unable to cancel"
      );
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">Account</p>

      <h2>My bookings</h2>

      {msg && <p className="notice">{msg}</p>}

      <div className="list">
        {data.length === 0 ? (
          <div className="panel">
            <p>No bookings yet.</p>
          </div>
        ) : (
          data.map((b) => (
            <div className="listRow" key={b.id}>
              <div>
                <strong>
                  {b.title || `Booking #${b.id}`}
                </strong>

                <p>
                  {b.status} · {b.payment_status} ·{" "}
                  {b.start_date} to {b.end_date}
                </p>
              </div>

              <span>₹{b.total_price}</span>

              <Link
                className="secondary"
                to={`/bookings/${b.id}`}
              >
                Booking Room
              </Link>

              {b.status !== "cancelled" && (
                <button
                  className="secondary"
                  onClick={() => cancel(b.id)}
                >
                  Cancel
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}



/* =========================
   BOOKING ROOM
========================= */

function BookingRoom() {
  const { id } = useParams();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [roomMsg, setRoomMsg] = useState("");
  const [sending, setSending] = useState(false);

  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [instructions, setInstructions] = useState("");
  const [handoffCode, setHandoffCode] = useState("");
  const [savingHandoff, setSavingHandoff] = useState(false);
  const [verifyingHandoff, setVerifyingHandoff] = useState(false);

  let storedUser = null;

  try {
    storedUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    storedUser = null;
  }

  const currentUserId = Number(storedUser?.id || 0);
  const isOwner =
    Number(room?.booking?.owner_id) === currentUserId;

  async function loadRoom() {
    try {
      const data = await getBookingRoom(id);

      setRoom(data);
      setPickupLocation(
        data.handoff?.pickup_location || ""
      );
      setPickupTime(
        data.handoff?.pickup_time || ""
      );
      setInstructions(
        data.handoff?.instructions || ""
      );
      setHandoffCode(
        data.handoff?.handoff_code || ""
      );
      setRoomMsg("");
    } catch (error) {
      setRoomMsg(
        error.response?.data?.message ||
          "Unable to load booking room"
      );
    }
  }

  async function loadMessages() {
    try {
      const data = await getBookingMessages(id);
      setMessages(data.messages || []);
    } catch {
      // Keep the room usable if a refresh temporarily fails.
    }
  }

  useEffect(() => {
    loadRoom();
    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  async function handleSendMessage(e) {
    e.preventDefault();

    if (!message.trim() || sending) return;

    try {
      setSending(true);
      const data = await sendBookingMessage(
        id,
        message.trim()
      );

      setMessages((current) => [
        ...current,
        data.message,
      ]);

      setMessage("");
      setRoomMsg("");
    } catch (error) {
      setRoomMsg(
        error.response?.data?.message ||
          "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  }

  async function saveHandoff(e) {
    e.preventDefault();

    if (savingHandoff) return;

    try {
      setSavingHandoff(true);

      const data = await updateBookingHandoff(
        id,
        {
          pickup_location: pickupLocation,
          pickup_time: pickupTime,
          instructions,
        }
      );

      setRoom((current) => ({
        ...current,
        handoff: data.handoff,
      }));

      setHandoffCode(
        data.handoff?.handoff_code || ""
      );
      setRoomMsg(
        "Pickup details updated successfully."
      );
    } catch (error) {
      setRoomMsg(
        error.response?.data?.message ||
          "Unable to update pickup details"
      );
    } finally {
      setSavingHandoff(false);
    }
  }

  async function verifyHandoff(e) {
    e.preventDefault();

    if (verifyingHandoff) return;

    try {
      setVerifyingHandoff(true);

      const data = await verifyBookingHandoff(
        id,
        handoffCode.trim()
      );

      setRoom((current) => ({
        ...current,
        handoff: data.handoff,
      }));

      setRoomMsg(
        "Handoff verified successfully."
      );
      setHandoffCode("");
    } catch (error) {
      setRoomMsg(
        error.response?.data?.message ||
          "Unable to verify handoff"
      );
    } finally {
      setVerifyingHandoff(false);
    }
  }

  if (!room) {
    return (
      <section className="page">
        <p>
          {roomMsg || "Loading booking room..."}
        </p>
      </section>
    );
  }

  const booking = room.booking;
  const handoff = room.handoff;
  const otherParty = isOwner
    ? booking.renter_name
    : booking.owner_name;

  return (
    <section className="page bookingRoom">
      <Link
        className="textLink bookingBack"
        to={isOwner ? "/owner" : "/bookings"}
      >
        ← Back
      </Link>

      <div className="bookingRoomHeader">
        <div>
          <p className="eyebrow">
            Rental handoff center
          </p>

          <h2>
            {booking.item_title}
          </h2>

          <p className="lead">
            Booking #{booking.id} · {booking.start_date} →{" "}
            {booking.end_date}
          </p>
        </div>

        <div className="bookingRoomBadges">
          <span className="statusBadge">
            {booking.status}
          </span>

          <span className="statusBadge">
            {booking.payment_status}
          </span>
        </div>
      </div>

      {roomMsg && (
        <p className="notice">
          {roomMsg}
        </p>
      )}

      <div className="bookingRoomGrid">
        <div className="bookingChat panel">
          <div className="bookingPanelHeader">
            <div>
              <p className="eyebrow">
                Booking chat
              </p>

              <h3>
                {isOwner
                  ? `Chat with ${booking.renter_name}`
                  : `Chat with ${booking.owner_name}`}
              </h3>
            </div>

            <span className="chatLiveBadge">
              Auto-refreshing
            </span>
          </div>

          <div className="bookingMessages">
            {messages.length === 0 ? (
              <div className="bookingMessageEmpty">
                <p>
                  Start the conversation about pickup,
                  timing, or anything needed for the rental.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const mine =
                  Number(m.sender_id) === currentUserId;

                return (
                  <div
                    className={`bookingMessage ${mine ? "mine" : ""}`}
                    key={m.id}
                  >
                    <div className="bookingMessageMeta">
                      <strong>
                        {mine
                          ? "You"
                          : m.sender_name || otherParty}
                      </strong>

                      <small>
                        {new Date(
                          m.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>

                    <p>{m.message}</p>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="bookingMessageForm"
            onSubmit={handleSendMessage}
          >
            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Message the owner about pickup, timing, or handoff..."
              rows="3"
              maxLength="2000"
            />

            <button
              className="primary"
              type="submit"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <div className="bookingSide">
          <div className="panel handoffPanel">
            <div className="bookingPanelHeader">
              <div>
                <p className="eyebrow">
                  Handoff
                </p>

                <h3>Pickup details</h3>
              </div>

              {handoff?.verified_at && (
                <span className="verifiedBadge">
                  ✓ Verified
                </span>
              )}
            </div>

            {isOwner ? (
              <form
                className="handoffForm"
                onSubmit={saveHandoff}
              >
                <label>
                  Pickup location
                  <input
                    value={pickupLocation}
                    onChange={(e) =>
                      setPickupLocation(e.target.value)
                    }
                    placeholder="e.g. Airoli Station, Gate 2"
                    maxLength="500"
                    required
                  />
                </label>

                <label>
                  Pickup time
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) =>
                      setPickupTime(e.target.value)
                    }
                  />
                </label>

                <label>
                  Instructions
                  <textarea
                    value={instructions}
                    onChange={(e) =>
                      setInstructions(e.target.value)
                    }
                    placeholder="Where should the renter meet you? What should they bring?"
                    rows="4"
                    maxLength="2000"
                  />
                </label>

                <button
                  className="primary"
                  type="submit"
                  disabled={savingHandoff}
                >
                  {savingHandoff
                    ? "Saving..."
                    : "Save Pickup Details"}
                </button>

                <div className="handoffCodeBox">
                  <span>Handoff code</span>
                  <strong>
                    {handoff?.handoff_code || "------"}
                  </strong>
                  <small>
                    Share this 6-digit code with the renter
                    at pickup.
                  </small>
                </div>
              </form>
            ) : (
              <div className="handoffDetails">
                <div className="handoffDetailRow">
                  <span>Pickup location</span>
                  <strong>
                    {handoff?.pickup_location ||
                      "Owner hasn't added a pickup location yet."}
                  </strong>
                </div>

                <div className="handoffDetailRow">
                  <span>Pickup time</span>
                  <strong>
                    {handoff?.pickup_time
                      ? new Date(
                          handoff.pickup_time
                        ).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "To be confirmed"}
                  </strong>
                </div>

                <div className="handoffDetailRow">
                  <span>Instructions</span>
                  <strong>
                    {handoff?.instructions ||
                      "No special instructions yet."}
                  </strong>
                </div>

                {!handoff?.verified_at ? (
                  <form
                    className="verifyHandoffForm"
                    onSubmit={verifyHandoff}
                  >
                    <label>
                      Enter handoff code
                      <input
                        value={handoffCode}
                        onChange={(e) =>
                          setHandoffCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        inputMode="numeric"
                        placeholder="6-digit code"
                        maxLength="6"
                      />
                    </label>

                    <button
                      className="primary"
                      type="submit"
                      disabled={
                        verifyingHandoff ||
                        handoffCode.length !== 6
                      }
                    >
                      {verifyingHandoff
                        ? "Verifying..."
                        : "Verify Handoff"}
                    </button>
                  </form>
                ) : (
                  <div className="handoffVerified">
                    <strong>
                      ✓ Handoff verified
                    </strong>
                    <p>
                      The pickup code has been successfully
                      verified for this booking.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="panel bookingSummaryPanel">
            <p className="eyebrow">
              Booking summary
            </p>

            <div className="summaryRow">
              <span>Renter</span>
              <strong>{booking.renter_name}</strong>
            </div>

            <div className="summaryRow">
              <span>Owner</span>
              <strong>{booking.owner_name}</strong>
            </div>

            <div className="summaryRow">
              <span>Total</span>
              <strong>
                ₹{Number(booking.total_price).toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* =========================
   OWNER DASHBOARD
========================= */

function OwnerDashboard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price_per_day: "",
    city: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState("");

  /* =========================
     AUTH + INITIAL LOAD
  ========================= */

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, []);

  /* =========================
     LOAD DASHBOARD
  ========================= */

  async function loadDashboard() {
    try {
      setLoading(true);
      setMsg("");

      const itemData = await getMyItems();

      const myItems = itemData.items || [];

      setItems(myItems);

      /*
        Load all bookings belonging to the owner's listings.
        This keeps the dashboard in sync with payment/status data
        and avoids making one request per listing.
      */

      const bookingData = await getOwnerBookings();

      setBookings(bookingData.bookings || []);
    } catch (error) {
      console.error("OWNER DASHBOARD ERROR:", error);

      setMsg(
        error.response?.data?.message ||
          "Unable to load owner dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     RESET FORM
  ========================= */

  function resetForm() {
    setForm({
      title: "",
      description: "",
      category: "",
      price_per_day: "",
      city: "",
      image: null,
    });

    setImagePreview("");
    setEditingId(null);
    setShowForm(false);
  }

  /* =========================
     EDIT ITEM
  ========================= */

  function startEdit(item) {
    setForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "",
      price_per_day: item.price_per_day || "",
      city: item.city || "",
      image: null,
    });

    /*
      Show existing image when editing.
    */

    setImagePreview(item.image_url || "");

    setEditingId(item.id);
    setShowForm(true);
  }

  /* =========================
     IMAGE SELECTION
  ========================= */

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      setForm((prev) => ({
        ...prev,
        image: null,
      }));

      setImagePreview("");
      return;
    }

    /*
      Basic validation.
    */

    if (!file.type.startsWith("image/")) {
      setMsg("Please select a valid image file.");

      e.target.value = "";

      setForm((prev) => ({
        ...prev,
        image: null,
      }));

      setImagePreview("");

      return;
    }

    /*
      Optional 5 MB limit.
    */

    if (file.size > 5 * 1024 * 1024) {
      setMsg("Image must be smaller than 5 MB.");

      e.target.value = "";

      setForm((prev) => ({
        ...prev,
        image: null,
      }));

      setImagePreview("");

      return;
    }

    setMsg("");

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    /*
      Create local preview.
    */

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  /* =========================
     SUBMIT FORM
  ========================= */

  async function handleSubmit(e) {
    e.preventDefault();

    setMsg("");

    try {
      /*
        =========================
        EDIT EXISTING ITEM
        =========================
      */

      if (editingId) {
        await updateItem(editingId, {
          title: form.title,
          description: form.description,
          category: form.category,
          price_per_day: Number(form.price_per_day),
          city: form.city,
        });

        setMsg("Item updated successfully.");

        resetForm();

        await loadDashboard();

        return;
      }

      /*
        =========================
        CREATE NEW ITEM
        =========================
      */

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append(
        "price_per_day",
        String(form.price_per_day)
      );
      formData.append("city", form.city);

      /*
        IMPORTANT:
        Backend expects upload.single("image")
      */

      if (form.image instanceof File) {
        formData.append("image", form.image);
      }

      /*
        Debug information.
        Check browser console if needed.
      */

      console.log("Creating listing...");
      console.log("Image:", form.image);

      for (const [key, value] of formData.entries()) {
        console.log(
          "FormData:",
          key,
          value instanceof File
            ? {
                name: value.name,
                type: value.type,
                size: value.size,
              }
            : value
        );
      }

      await createItem(formData);

      setMsg("Item created successfully.");

      resetForm();

      /*
        Reload listings so the new Cloudinary URL
        appears immediately.
      */

      await loadDashboard();

    } catch (error) {
      console.error("CREATE ITEM ERROR:", error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message;

      setMsg(
        backendMessage ||
          error.message ||
          "Unable to save item"
      );
    }
  }

  /* =========================
     DELETE ITEM
  ========================= */

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    try {
      await deleteItem(id);

      setMsg("Item deleted successfully.");

      await loadDashboard();
    } catch (error) {
      console.error("DELETE ITEM ERROR:", error);

      setMsg(
        error.response?.data?.message ||
          "Unable to delete item"
      );
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <section className="page">
        <p>Loading owner dashboard...</p>
      </section>
    );
  }

  /* =========================
     STATS
  ========================= */

  const totalListings = items.length;

  const totalBookings = bookings.length;

  const totalRevenue = bookings
    .filter(
      (booking) =>
        booking.payment_status === "paid" &&
        booking.status !== "cancelled"
    )
    .reduce(
      (sum, booking) =>
        sum + Number(booking.total_price || 0),
      0
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeRentals = bookings.filter((booking) => {
    if (
      booking.status !== "confirmed" ||
      booking.payment_status !== "paid"
    ) {
      return false;
    }

    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return startDate <= today && endDate >= today;
  }).length;

  /* =========================
     UI
  ========================= */

  return (
    <section className="page">

      {/* HEADER */}

      <div className="sectionHead">
        <div>
          <p className="eyebrow">
            Owner workspace
          </p>

          <h2>Owner Dashboard</h2>

          <p className="lead">
            Manage your rental listings and monitor
            bookings.
          </p>
        </div>

        <button
          className="primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Item
        </button>
      </div>


      {/* MESSAGE */}

      {msg && (
        <p className="notice">
          {msg}
        </p>
      )}


      {/* STATS */}

      <div className="grid">

        <div className="card">
          <div className="cardBody">
            <p className="eyebrow">
              LISTINGS
            </p>

            <h2>{totalListings}</h2>

            <p>
              Items currently listed
            </p>
          </div>
        </div>


        <div className="card">
          <div className="cardBody">
            <p className="eyebrow">
              BOOKINGS
            </p>

            <h2>{totalBookings}</h2>

            <p>
              Total booking records
            </p>
          </div>
        </div>


        <div className="card">
          <div className="cardBody">
            <p className="eyebrow">
              REVENUE
            </p>

            <h2>₹{totalRevenue.toLocaleString("en-IN")}</h2>

            <p>
              Paid rental revenue
            </p>
          </div>
        </div>


        <div className="card">
          <div className="cardBody">
            <p className="eyebrow">
              ACTIVE RENTALS
            </p>

            <h2>{activeRentals}</h2>

            <p>
              Paid rentals active today
            </p>
          </div>
        </div>

      </div>


      {/* ADD / EDIT FORM */}

      {showForm && (
        <div
          className="panel"
          style={{ marginTop: 30 }}
        >

          <div className="sectionHead">

            <div>
              <p className="eyebrow">
                {editingId
                  ? "Manage listing"
                  : "New listing"}
              </p>

              <h2>
                {editingId
                  ? "Edit Item"
                  : "Add New Item"}
              </h2>
            </div>

            <button
              type="button"
              className="secondary"
              onClick={resetForm}
            >
              Close
            </button>

          </div>


          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "14px",
              marginTop: "20px",
            }}
          >

            {/* TITLE */}

            <input
              required
              placeholder="Item title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
            />


            {/* DESCRIPTION */}

            <textarea
              required
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              rows="4"
            />


            {/* CATEGORY */}

            <input
              required
              placeholder="Category e.g. Camera"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
            />


            {/* PRICE */}

            <input
              required
              type="number"
              min="1"
              placeholder="Price per day"
              value={form.price_per_day}
              onChange={(e) =>
                setForm({
                  ...form,
                  price_per_day: e.target.value,
                })
              }
            />


            {/* CITY */}

            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  city: e.target.value,
                })
              }
            />


            {/* IMAGE */}

            {!editingId && (
              <div
                style={{
                  display: "grid",
                  gap: "10px",
                }}
              >

                <label>
                  <strong>
                    Item Image
                  </strong>
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                />

                {form.image && (
                  <p>
                    Selected image:{" "}
                    <strong>
                      {form.image.name}
                    </strong>
                  </p>
                )}

                {imagePreview && (
                  <div
                    style={{
                      width: "220px",
                      height: "160px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #ddd",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Selected item preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

              </div>
            )}


            {/* SUBMIT */}

            <button
              className="primary"
              type="submit"
            >
              {editingId
                ? "Save Changes"
                : "Create Listing"}
            </button>

          </form>
        </div>
      )}


      {/* MY LISTINGS */}

      <div style={{ marginTop: 40 }}>

        <p className="eyebrow">
          Inventory
        </p>

        <h2>My Listings</h2>


        {items.length === 0 ? (

          <div className="panel">

            <p>
              You don't have any listings yet.
            </p>

            <button
              className="primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add your first item
            </button>

          </div>

        ) : (

          <div className="grid">

            {items.map((item) => (

              <div
                className="card"
                key={item.id}
              >

                {/* IMAGE */}

                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "230px",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      console.error(
                        "IMAGE LOAD FAILED:",
                        item.image_url
                      );

                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="placeholder">
                    No image
                  </div>
                )}


                {/* DETAILS */}

                <div className="cardBody">

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.category}
                    {item.city
                      ? ` · ${item.city}`
                      : ""}
                  </p>

                  <strong>
                    ₹{item.price_per_day}/day
                  </strong>


                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "15px",
                    }}
                  >

                    <button
                      className="secondary"
                      onClick={() =>
                        startEdit(item)
                      }
                    >
                      Edit
                    </button>


                    <button
                      className="secondary"
                      onClick={() =>
                        handleDelete(item.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* BOOKINGS */}

      <div style={{ marginTop: 50 }}>

        <p className="eyebrow">
          Rental activity
        </p>

        <h2>Bookings</h2>


        {bookings.length === 0 ? (

          <div className="panel">

            <p>
              No bookings for your listings yet.
            </p>

          </div>

        ) : (

          <div className="list">

            {bookings.map(
              (booking, index) => (

                <div
                  className="listRow"
                  key={`${booking.item_id}-${index}`}
                >

                  <div>

                    <strong>
                      {booking.item_title}
                    </strong>

                    <p>
                      {booking.start_date}
                      {" → "}
                      {booking.end_date}
                    </p>

                  </div>

                  <span>
                    Booking
                  </span>

                  <Link
                    className="secondary"
                    to={`/bookings/${booking.id}`}
                  >
                    Booking Room
                  </Link>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </section>
  );
}


/* =========================
   AI
========================= */

function AI() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! Tell me what you want to rent, your city, budget, or dates.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e) {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const text = input.trim();

    setInput("");
    setLoading(true);

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: text,
      },
    ];

    setMessages(updatedMessages);

    try {
      const d = await askAI(updatedMessages);

     setMessages((current) => [
  ...current,
  {
    role: "assistant",
    content:
      d.reply || "I couldn't find an answer.",
    matches: d.matches || [],
  },
]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "AI service is unavailable right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="chat page">
      <p className="eyebrow">
        AI rental assistant
      </p>

      <h2>Ask RentMyThing AI</h2>

     <div className="messages">
  {messages.map((m, i) => (
    <div key={i}>
      <div className={`bubble ${m.role}`}>
        {m.content}
      </div>

      {m.role === "assistant" &&
        m.matches?.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "12px",
              marginBottom: "18px",
            }}
          >
            {m.matches.map((item) => (
              <div
                key={item.id}
                style={{
                  width: "220px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "14px",
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow:
                    "0 4px 14px rgba(0,0,0,0.08)",
                }}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "140px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "140px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f3f3f3",
                      color: "#777",
                    }}
                  >
                    No image
                  </div>
                )}

                <div
                  style={{
                    padding: "14px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 6px",
                      fontSize: "17px",
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {item.category}
                    {item.city
                      ? ` · ${item.city}`
                      : ""}
                  </p>

                  <strong
                    style={{
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    ₹{item.price_per_day}/day
                  </strong>

                  <Link
                    to={`/items/${item.id}`}
                    className="primary"
                    style={{
                      display: "inline-block",
                      textDecoration: "none",
                      fontSize: "14px",
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  ))}

  {loading && (
    <div className="bubble assistant">
      Thinking...
    </div>
  )}
</div>

      <form
        className="chatForm"
        onSubmit={send}
      >
        <input
          value={input}
          disabled={loading}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder={
            loading
              ? "AI is thinking..."
              : "e.g. I need a camera under ₹1000/day"
          }
        />

        <button
          className="primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>
    </section>
  );
}


/* =========================
   ROUTES
========================= */

export default function App() {
  return (
    <Layout>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/items"
          element={<Items />}
        />

        <Route
          path="/items/:id"
          element={<ItemDetails />}
        />

        <Route
          path="/login"
          element={<Auth mode="login" />}
        />

        <Route
          path="/register"
          element={<Auth mode="register" />}
        />

        <Route
          path="/bookings/:id"
          element={<BookingRoom />}
        />

        <Route
          path="/bookings"
          element={<Bookings />}
        />

        <Route
          path="/owner"
          element={<OwnerDashboard />}
        />

        <Route
          path="/ai"
          element={<AI />}
        />

      </Routes>

    </Layout>
  );
}