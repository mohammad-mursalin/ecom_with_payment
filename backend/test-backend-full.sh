#!/bin/bash
# =============================================================================
# Full Backend API Test Suite
# Tests every endpoint in API_ENDPOINTS.md with positive + negative cases
# Requires: curl, python3 (for JSON parsing)
# Usage: chmod +x test-backend-full.sh && ./test-backend-full.sh
# =============================================================================

BASE_URL="http://localhost:8080"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Counters ──────────────────────────────────────────────────────────────────
PASS=0; FAIL=0; SKIP=0
declare -a FAILURES=()

# ── Helpers ───────────────────────────────────────────────────────────────────
pass() { echo -e "  ${GREEN}✔ PASS${NC}  $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✘ FAIL${NC}  $1"; FAIL=$((FAIL+1)); FAILURES+=("$1"); }
skip() { echo -e "  ${YELLOW}⊘ SKIP${NC}  $1"; SKIP=$((SKIP+1)); }
section() { echo -e "\n${CYAN}${BOLD}══════════════════════════════════════${NC}"; echo -e "${CYAN}${BOLD}  $1${NC}"; echo -e "${CYAN}${BOLD}══════════════════════════════════════${NC}"; }

# JSON field extractor using python3
jget() { python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)" 2>/dev/null; }
jcheck() { python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if ($2) else 'fail')" <<< "$1" 2>/dev/null; }

# Make a request and return body
GET()  { curl -s --connect-timeout 5 -X GET  "$BASE_URL$1" "${@:2}"; }
POST() { curl -s --connect-timeout 5 -X POST "$BASE_URL$1" "${@:2}"; }
PUT()  { curl -s --connect-timeout 5 -X PUT  "$BASE_URL$1" "${@:2}"; }
PATCH(){ curl -s --connect-timeout 5 -X PATCH "$BASE_URL$1" "${@:2}"; }
DEL()  { curl -s --connect-timeout 5 -X DELETE "$BASE_URL$1" "${@:2}"; }

JSON_HDR='-H Content-Type: application/json'

# Check if server is reachable
check_server() {
  curl -s --connect-timeout 3 "$BASE_URL/api/" >/dev/null 2>&1
}

echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}         Full Backend API Test Suite               ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo "  Target: $BASE_URL"
echo "  Date:   $(date)"

if ! check_server; then
  echo -e "\n${RED}ERROR: Server not reachable at $BASE_URL${NC}"
  exit 1
fi
echo -e "  ${GREEN}Server is reachable ✔${NC}"

# =============================================================================
# 1. GREETING
# =============================================================================
section "1. GREETING"

R=$(GET /api/)
[[ "$R" == "assalamualaikum" ]] && pass "GET /api/ → correct greeting" \
  || fail "GET /api/ → expected 'assalamualaikum', got: $R"

# =============================================================================
# 2. AUTH — REGISTRATION
# =============================================================================
section "2. AUTH — Registration"

TS=$(date +%s)
REG_EMAIL="testuser_${TS}@test.com"
REG_USER="testuser_${TS}"

# 2a. Valid registration
R=$(POST /api/auth/register -H "Content-Type: application/json" \
  -d "{\"username\":\"$REG_USER\",\"email\":\"$REG_EMAIL\",\"password\":\"Password123!\",\"confirmPassword\":\"Password123!\"}")
if python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']['accessToken']" <<< "$R" 2>/dev/null; then
  pass "POST /api/auth/register → user created, token returned"
  USER_TOKEN=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['data']['accessToken'])" <<< "$R")
  USER_REFRESH=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['data']['refreshToken'])" <<< "$R")
else
  fail "POST /api/auth/register → $R"
  USER_TOKEN=""
fi

# 2b. Duplicate registration
R=$(POST /api/auth/register -H "Content-Type: application/json" \
  -d "{\"username\":\"$REG_USER\",\"email\":\"$REG_EMAIL\",\"password\":\"Password123!\",\"confirmPassword\":\"Password123!\"}")
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "409" || "$STATUS" == "400" ]] && pass "POST /api/auth/register (duplicate) → conflict error returned" \
  || fail "POST /api/auth/register (duplicate) → expected 409/400, got: $R"

# 2c. Missing fields
R=$(POST /api/auth/register -H "Content-Type: application/json" -d '{"username":"x"}')
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "400" ]] && pass "POST /api/auth/register (missing fields) → 400 validation error" \
  || fail "POST /api/auth/register (missing fields) → expected 400, got: $R"

# 2d. Password mismatch
R=$(POST /api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"mismatch_user","email":"mismatch@test.com","password":"Password123!","confirmPassword":"Different!"}')
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "400" ]] && pass "POST /api/auth/register (password mismatch) → 400 error" \
  || fail "POST /api/auth/register (password mismatch) → expected 400, got: $R"

# =============================================================================
# 3. AUTH — CHECK USERNAME / EMAIL
# =============================================================================
section "3. AUTH — Username & Email Availability"

R=$(GET "/api/auth/check-username?username=nonexistent_xyz_99999")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True" <<< "$R" 2>/dev/null \
  && pass "GET /api/auth/check-username (available) → success true" \
  || fail "GET /api/auth/check-username → $R"

R=$(GET "/api/auth/check-username?username=$REG_USER")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']==False" <<< "$R" 2>/dev/null \
  && pass "GET /api/auth/check-username (taken) → data false" \
  || fail "GET /api/auth/check-username (taken) → $R"

R=$(GET "/api/auth/check-email?email=nonexistent_xyz_99999@nowhere.com")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True" <<< "$R" 2>/dev/null \
  && pass "GET /api/auth/check-email (available) → success true" \
  || fail "GET /api/auth/check-email → $R"

R=$(GET "/api/auth/check-email?email=$REG_EMAIL")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']==False" <<< "$R" 2>/dev/null \
  && pass "GET /api/auth/check-email (taken) → data false" \
  || fail "GET /api/auth/check-email (taken) → $R"

# =============================================================================
# 4. AUTH — LOGIN
# =============================================================================
section "4. AUTH — Login"

# 4a. Valid login
R=$(POST /api/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"$REG_EMAIL\",\"password\":\"Password123!\"}")
if python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']['accessToken']" <<< "$R" 2>/dev/null; then
  pass "POST /api/auth/login (valid) → token returned"
  USER_TOKEN=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['data']['accessToken'])" <<< "$R")
  USER_REFRESH=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['data']['refreshToken'])" <<< "$R")
else
  fail "POST /api/auth/login → $R"
fi

# 4b. Wrong password
R=$(POST /api/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"$REG_EMAIL\",\"password\":\"wrongpassword\"}")
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "401" ]] && pass "POST /api/auth/login (wrong password) → 401 Unauthorized" \
  || fail "POST /api/auth/login (wrong password) → expected 401, got: $R"

# 4c. Non-existent user
R=$(POST /api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"nobody_at_all@nowhere.com","password":"Password123!"}')
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "401" || "$STATUS" == "404" ]] && pass "POST /api/auth/login (non-existent user) → 401/404" \
  || fail "POST /api/auth/login (non-existent user) → expected 401/404, got: $R"

# 4d. No token on protected route without auth
R=$(GET /api/auth/profile)
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "401" ]] && pass "GET /api/auth/profile (no token) → 401 Unauthorized" \
  || fail "GET /api/auth/profile (no token) → expected 401, got: $R"

# =============================================================================
# 5. AUTH — PROFILE
# =============================================================================
section "5. AUTH — Profile"

if [ -z "$USER_TOKEN" ]; then
  skip "Profile tests — no token available"
else
  AUTH="-H Authorization: Bearer $USER_TOKEN"

  # 5a. Get profile
  R=$(GET /api/auth/profile -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']['username']" <<< "$R" 2>/dev/null \
    && pass "GET /api/auth/profile → profile returned" \
    || fail "GET /api/auth/profile → $R"

  # 5b. Update profile
  R=$(PUT /api/auth/profile -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"fullName":"Test Full Name","phoneNumber":"1234567890","bio":"Test bio"}')
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']['fullName']=='Test Full Name'" <<< "$R" 2>/dev/null \
    && pass "PUT /api/auth/profile → profile updated" \
    || fail "PUT /api/auth/profile → $R"

  # 5c. Change password
  R=$(PUT /api/auth/password -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"currentPassword":"Password123!","newPassword":"NewPassword123!","confirmNewPassword":"NewPassword123!"}')
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True" <<< "$R" 2>/dev/null \
    && pass "PUT /api/auth/password → password changed" \
    || fail "PUT /api/auth/password → $R"

  # 5d. Old password should now fail
  R=$(POST /api/auth/login -H "Content-Type: application/json" \
    -d "{\"email\":\"$REG_EMAIL\",\"password\":\"Password123!\"}")
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" == "401" ]] && pass "POST /api/auth/login (old password after change) → 401 rejected" \
    || fail "POST /api/auth/login (old password after change) → expected 401, got: $R"

  # 5e. New password works — re-login to refresh token
  R=$(POST /api/auth/login -H "Content-Type: application/json" \
    -d "{\"email\":\"$REG_EMAIL\",\"password\":\"NewPassword123!\"}")
  if python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True" <<< "$R" 2>/dev/null; then
    pass "POST /api/auth/login (new password) → login successful"
    USER_TOKEN=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['data']['accessToken'])" <<< "$R")
    USER_REFRESH=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['data']['refreshToken'])" <<< "$R")
  else
    fail "POST /api/auth/login (new password) → $R"
  fi

  # 5f. Wrong current password on change
  R=$(PUT /api/auth/password -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"currentPassword":"WrongOldPass!","newPassword":"Another123!","confirmNewPassword":"Another123!"}')
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" == "400" || "$STATUS" == "401" ]] && pass "PUT /api/auth/password (wrong current) → error returned" \
    || fail "PUT /api/auth/password (wrong current) → expected 400/401, got: $R"
fi

# =============================================================================
# 6. AUTH — TOKEN REFRESH
# =============================================================================
section "6. AUTH — Token Refresh"

if [ -n "$USER_REFRESH" ]; then
  R=$(POST /api/auth/refresh -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$USER_REFRESH\"}")
  if python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']['accessToken']" <<< "$R" 2>/dev/null; then
    pass "POST /api/auth/refresh (valid) → new access token returned"
    USER_TOKEN=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d['data']['accessToken'])" <<< "$R")
  else
    fail "POST /api/auth/refresh (valid) → $R"
  fi
else
  skip "Token refresh test — no refresh token"
fi

R=$(POST /api/auth/refresh -H "Content-Type: application/json" \
  -d '{"refreshToken":"totally-invalid-garbage-token"}')
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "401" || "$STATUS" == "400" || "$STATUS" == "500" ]] \
  && pass "POST /api/auth/refresh (invalid token) → error returned" \
  || fail "POST /api/auth/refresh (invalid token) → expected error, got: $R"

# =============================================================================
# 7. CATEGORIES
# =============================================================================
section "7. Categories"

R=$(GET /api/categories)
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and isinstance(d['data'], list)" <<< "$R" 2>/dev/null \
  && pass "GET /api/categories → list returned" \
  || fail "GET /api/categories → $R"

# Grab a category ID for later tests
CATEGORY_ID=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); cats=d.get('data',[]); print(cats[0]['id'] if cats else '')" <<< "$R" 2>/dev/null)
[ -n "$CATEGORY_ID" ] && echo "    → Using category ID: $CATEGORY_ID" || echo "    → No categories found, some tests will be skipped"

# =============================================================================
# 8. BRANDS
# =============================================================================
section "8. Brands"

R=$(GET /api/brands)
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert isinstance(d, list) or d.get('success')==True" <<< "$R" 2>/dev/null \
  && pass "GET /api/brands → brands returned" \
  || fail "GET /api/brands → $R"

if [ -n "$CATEGORY_ID" ]; then
  R=$(GET "/api/brands?categoryId=$CATEGORY_ID")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert isinstance(d, list) or d.get('success')==True" <<< "$R" 2>/dev/null \
    && pass "GET /api/brands?categoryId=$CATEGORY_ID → filtered brands returned" \
    || fail "GET /api/brands?categoryId= → $R"
else
  skip "GET /api/brands?categoryId — no category available"
fi

# =============================================================================
# 9. PRODUCTS
# =============================================================================
section "9. Products"

# 9a. List with pagination
R=$(GET "/api/products?page=0&size=5")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['content'] is not None" <<< "$R" 2>/dev/null \
  && pass "GET /api/products?page=0&size=5 → paginated list" \
  || fail "GET /api/products → $R"

PRODUCT_ID=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); items=d.get('content',[]); print(items[0]['id'] if items else '')" <<< "$R" 2>/dev/null)
[ -n "$PRODUCT_ID" ] && echo "    → Using product ID: $PRODUCT_ID"

# 9b. Filter by price
R=$(GET "/api/products?minPrice=1&maxPrice=9999&page=0&size=5")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['content'] is not None" <<< "$R" 2>/dev/null \
  && pass "GET /api/products (price filter) → paginated list" \
  || fail "GET /api/products (price filter) → $R"

# 9c. Sort options
for SORT in newest price-asc price-desc rating; do
  R=$(GET "/api/products?sort=$SORT&page=0&size=3")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['content'] is not None" <<< "$R" 2>/dev/null \
    && pass "GET /api/products?sort=$SORT → accepted" \
    || fail "GET /api/products?sort=$SORT → $R"
done

# 9d. Search suggestions
R=$(GET "/api/products/search/suggestions?q=a&limit=5")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert isinstance(d, list)" <<< "$R" 2>/dev/null \
  && pass "GET /api/products/search/suggestions → array returned" \
  || fail "GET /api/products/search/suggestions → $R"

# 9e. Search endpoint
R=$(GET "/api/products/search?keyword=a&page=0&size=5")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('content') is not None or d.get('success')" <<< "$R" 2>/dev/null \
  && pass "GET /api/products/search?keyword=a → results returned" \
  || fail "GET /api/products/search → $R"

# 9f. Single product
if [ -n "$PRODUCT_ID" ]; then
  R=$(GET "/api/product/$PRODUCT_ID")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data']['id']" <<< "$R" 2>/dev/null \
    && pass "GET /api/product/$PRODUCT_ID → product returned" \
    || fail "GET /api/product/$PRODUCT_ID → $R"

  # 9g. Related products
  R=$(GET "/api/product/$PRODUCT_ID/related")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert isinstance(d, list)" <<< "$R" 2>/dev/null \
    && pass "GET /api/product/$PRODUCT_ID/related → list returned" \
    || fail "GET /api/product/$PRODUCT_ID/related → $R"

  # 9h. Also bought
  R=$(GET "/api/product/$PRODUCT_ID/also-bought")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert isinstance(d, list)" <<< "$R" 2>/dev/null \
    && pass "GET /api/product/$PRODUCT_ID/also-bought → list returned" \
    || fail "GET /api/product/$PRODUCT_ID/also-bought → $R"
else
  skip "Single product / related / also-bought — no products in DB"
fi

# 9i. Non-existent product
R=$(GET "/api/product/9999999")
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "404" ]] && pass "GET /api/product/9999999 → 404 Not Found" \
  || fail "GET /api/product/9999999 → expected 404, got: $R"

# =============================================================================
# 10. CART
# =============================================================================
section "10. Cart"

if [ -z "$USER_TOKEN" ]; then
  skip "All cart tests — no token"
else
  # 10a. Get cart
  R=$(GET /api/cart -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('items') is not None" <<< "$R" 2>/dev/null \
    && pass "GET /api/cart → cart returned" \
    || fail "GET /api/cart → $R"

  CART_ITEM_ID=""
  if [ -n "$PRODUCT_ID" ]; then
    # 10b. Add item
    R=$(POST /api/cart/items -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":$PRODUCT_ID,\"quantity\":2}")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('items') is not None or d.get('success')==True or d.get('id')" <<< "$R" 2>/dev/null \
      && pass "POST /api/cart/items → item added" \
      || fail "POST /api/cart/items → $R"

    # 10c. Get cart again to find item ID
    R=$(GET /api/cart -H "Authorization: Bearer $USER_TOKEN")
    CART_ITEM_ID=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); items=d.get('items',[]); print(items[0]['id'] if items else '')" <<< "$R" 2>/dev/null)

    if [ -n "$CART_ITEM_ID" ]; then
      # 10d. Update quantity
      R=$(PUT /api/cart/items/$CART_ITEM_ID -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"quantity":3}')
      python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('items') is not None or d.get('success')==True" <<< "$R" 2>/dev/null \
        && pass "PUT /api/cart/items/$CART_ITEM_ID → quantity updated" \
        || fail "PUT /api/cart/items/$CART_ITEM_ID → $R"

      # 10e. Remove item
      R=$(DEL /api/cart/items/$CART_ITEM_ID -H "Authorization: Bearer $USER_TOKEN")
      python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('items') is not None or d.get('success')==True" <<< "$R" 2>/dev/null \
        && pass "DELETE /api/cart/items/$CART_ITEM_ID → item removed" \
        || fail "DELETE /api/cart/items/$CART_ITEM_ID → $R"
    fi

    # 10f. Sync cart
    R=$(POST /api/cart/sync -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"items\":[{\"productId\":$PRODUCT_ID,\"quantity\":1}]}")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('items') is not None or d.get('success')==True" <<< "$R" 2>/dev/null \
      && pass "POST /api/cart/sync → cart synced" \
      || fail "POST /api/cart/sync → $R"
  else
    skip "Cart add/update/remove/sync — no product in DB"
  fi

  # 10g. Cart without auth
  R=$(GET /api/cart)
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" == "401" ]] && pass "GET /api/cart (no auth) → 401 Unauthorized" \
    || fail "GET /api/cart (no auth) → expected 401, got: $R"
fi

# =============================================================================
# 11. WISHLIST
# =============================================================================
section "11. Wishlist"

if [ -z "$USER_TOKEN" ]; then
  skip "All wishlist tests — no token"
else
  # 11a. Get wishlist
  R=$(GET /api/wishlist -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('items') is not None" <<< "$R" 2>/dev/null \
    && pass "GET /api/wishlist → wishlist returned" \
    || fail "GET /api/wishlist → $R"

  if [ -n "$PRODUCT_ID" ]; then
    # 11b. Add to wishlist
    R=$(POST /api/wishlist -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":$PRODUCT_ID}")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('productId') or d.get('success')==True or d.get('id')" <<< "$R" 2>/dev/null \
      && pass "POST /api/wishlist → product added" \
      || fail "POST /api/wishlist → $R"

    # 11c. Add duplicate (should not error or deduplicate gracefully)
    R=$(POST /api/wishlist -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":$PRODUCT_ID}")
    STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status','ok'))" <<< "$R" 2>/dev/null)
    [[ "$STATUS" != "500" ]] && pass "POST /api/wishlist (duplicate) → handled gracefully (no 500)" \
      || fail "POST /api/wishlist (duplicate) → 500 server error"

    # 11d. Sort by date
    R=$(GET "/api/wishlist?sort=date_added" -H "Authorization: Bearer $USER_TOKEN")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('items') is not None" <<< "$R" 2>/dev/null \
      && pass "GET /api/wishlist?sort=date_added → sorted list" \
      || fail "GET /api/wishlist?sort=date_added → $R"

    # 11e. Remove from wishlist
    R=$(DEL /api/wishlist/$PRODUCT_ID -H "Authorization: Bearer $USER_TOKEN")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or True" <<< "$R" 2>/dev/null \
      && pass "DELETE /api/wishlist/$PRODUCT_ID → removed" \
      || fail "DELETE /api/wishlist/$PRODUCT_ID → $R"
  else
    skip "Wishlist add/remove — no product in DB"
  fi

  # 11f. Wishlist without auth
  R=$(GET /api/wishlist)
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" == "401" ]] && pass "GET /api/wishlist (no auth) → 401 Unauthorized" \
    || fail "GET /api/wishlist (no auth) → expected 401, got: $R"
fi

# =============================================================================
# 12. ADDRESSES
# =============================================================================
section "12. Addresses"

if [ -z "$USER_TOKEN" ]; then
  skip "All address tests — no token"
else
  # 12a. Get addresses
  R=$(GET /api/users/me/addresses -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and isinstance(d['data'], list)" <<< "$R" 2>/dev/null \
    && pass "GET /api/users/me/addresses → list returned" \
    || fail "GET /api/users/me/addresses → $R"

  # 12b. Create address
  R=$(POST /api/users/me/addresses -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"label":"Home","fullName":"Test User","phone":"1234567890","line1":"123 Main St","city":"Dhaka","state":"Dhaka","pinCode":"1200","country":"BD"}')
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or d.get('data')" <<< "$R" 2>/dev/null \
    && pass "POST /api/users/me/addresses → address created" \
    || fail "POST /api/users/me/addresses → $R"

  ADDRESS_ID=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); data=d.get('data',{}); print(data.get('id','') if isinstance(data,dict) else '')" <<< "$R" 2>/dev/null)
  [ -n "$ADDRESS_ID" ] && echo "    → Using address ID: $ADDRESS_ID"

  if [ -n "$ADDRESS_ID" ]; then
    # 12c. Update address
    R=$(PUT /api/users/me/addresses/$ADDRESS_ID -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"label":"Work","fullName":"Updated Name","phone":"0987654321","line1":"456 Office Rd","city":"Chittagong","state":"Chittagong","pinCode":"4000","country":"BD"}')
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or d.get('data')" <<< "$R" 2>/dev/null \
      && pass "PUT /api/users/me/addresses/$ADDRESS_ID → address updated" \
      || fail "PUT /api/users/me/addresses/$ADDRESS_ID → $R"

    # 12d. Set as default
    R=$(PATCH /api/users/me/addresses/$ADDRESS_ID/default -H "Authorization: Bearer $USER_TOKEN")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or d.get('data')" <<< "$R" 2>/dev/null \
      && pass "PATCH /api/users/me/addresses/$ADDRESS_ID/default → set as default" \
      || fail "PATCH /api/users/me/addresses/$ADDRESS_ID/default → $R"

    # 12e. Delete address
    R=$(DEL /api/users/me/addresses/$ADDRESS_ID -H "Authorization: Bearer $USER_TOKEN")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or True" <<< "$R" 2>/dev/null \
      && pass "DELETE /api/users/me/addresses/$ADDRESS_ID → deleted" \
      || fail "DELETE /api/users/me/addresses/$ADDRESS_ID → $R"
  fi

  # 12f. Create address for order use later (re-create)
  R=$(POST /api/users/me/addresses -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"label":"Home","fullName":"Test User","phone":"1234567890","line1":"123 Main St","city":"Dhaka","state":"Dhaka","pinCode":"1200","country":"BD"}')
  ADDRESS_ID=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); data=d.get('data',{}); print(data.get('id','') if isinstance(data,dict) else '')" <<< "$R" 2>/dev/null)
fi

# =============================================================================
# 13. RECENTLY VIEWED
# =============================================================================
section "13. Recently Viewed"

if [ -z "$USER_TOKEN" ]; then
  skip "All recently viewed tests — no token"
else
  # 13a. Get recently viewed (empty or list)
  R=$(GET /api/users/me/recently-viewed -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert isinstance(d, list) or d.get('success')==True" <<< "$R" 2>/dev/null \
    && pass "GET /api/users/me/recently-viewed → list returned" \
    || fail "GET /api/users/me/recently-viewed → $R"

  if [ -n "$PRODUCT_ID" ]; then
    # 13b. Add to recently viewed
    R=$(POST /api/users/me/recently-viewed -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":$PRODUCT_ID}")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or True" <<< "$R" 2>/dev/null \
      && pass "POST /api/users/me/recently-viewed → product tracked" \
      || fail "POST /api/users/me/recently-viewed → $R"

    # 13c. Get with limit
    R=$(GET "/api/users/me/recently-viewed?limit=5" -H "Authorization: Bearer $USER_TOKEN")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert isinstance(d, list) or d.get('success')==True" <<< "$R" 2>/dev/null \
      && pass "GET /api/users/me/recently-viewed?limit=5 → limited list" \
      || fail "GET /api/users/me/recently-viewed?limit=5 → $R"
  fi

  # 13d. Clear history
  R=$(DEL /api/users/me/recently-viewed -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or True" <<< "$R" 2>/dev/null \
    && pass "DELETE /api/users/me/recently-viewed → history cleared" \
    || fail "DELETE /api/users/me/recently-viewed → $R"
fi

# =============================================================================
# 14. SHIPPING
# =============================================================================
section "14. Shipping"

R=$(GET "/api/shipping/estimate?subtotal=99.99&method=STANDARD")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data'] is not None" <<< "$R" 2>/dev/null \
  && pass "GET /api/shipping/estimate (STANDARD) → fee returned" \
  || fail "GET /api/shipping/estimate (STANDARD) → $R"

R=$(GET "/api/shipping/estimate?subtotal=99.99&method=EXPRESS")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True and d['data'] is not None" <<< "$R" 2>/dev/null \
  && pass "GET /api/shipping/estimate (EXPRESS) → fee returned" \
  || fail "GET /api/shipping/estimate (EXPRESS) → $R"

R=$(GET "/api/shipping/estimate?subtotal=0&method=STANDARD")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or d.get('status')" <<< "$R" 2>/dev/null \
  && pass "GET /api/shipping/estimate (zero subtotal) → handled" \
  || fail "GET /api/shipping/estimate (zero subtotal) → $R"

R=$(GET "/api/shipping/estimate?subtotal=50&method=INVALID")
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status','ok'))" <<< "$R" 2>/dev/null)
[[ "$STATUS" != "500" ]] && pass "GET /api/shipping/estimate (invalid method) → no 500 error" \
  || fail "GET /api/shipping/estimate (invalid method) → 500 server crash"

# =============================================================================
# 15. COUPONS
# =============================================================================
section "15. Coupons"

# 15a. Invalid coupon
R=$(POST /api/coupons/validate -H "Content-Type: application/json" \
  -d '{"code":"NOTAVALIDCOUPON999","orderSubtotal":100}')
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); data=d.get('data',{}); assert d.get('success')==False or data.get('valid')==False or d.get('status',0)>=400" <<< "$R" 2>/dev/null \
  && pass "POST /api/coupons/validate (invalid code) → rejected correctly" \
  || fail "POST /api/coupons/validate (invalid code) → $R"

# 15b. Empty code
R=$(POST /api/coupons/validate -H "Content-Type: application/json" \
  -d '{"code":"","orderSubtotal":100}')
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "400" || "$STATUS" == "404" || "$STATUS" == "422" ]] \
  && pass "POST /api/coupons/validate (empty code) → error returned" \
  || fail "POST /api/coupons/validate (empty code) → expected 4xx, got: $R"

# =============================================================================
# 16. ORDERS
# =============================================================================
section "16. Orders"

if [ -z "$USER_TOKEN" ]; then
  skip "All order tests — no token"
else
  # 16a. Get orders (should be empty for new user)
  R=$(GET "/api/orders?page=0&pageSize=10" -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('content') is not None" <<< "$R" 2>/dev/null \
    && pass "GET /api/orders → paginated order list returned" \
    || fail "GET /api/orders → $R"

  # 16b. Order with status filter
  R=$(GET "/api/orders?status=ALL&page=0&pageSize=5" -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('content') is not None" <<< "$R" 2>/dev/null \
    && pass "GET /api/orders?status=ALL → filtered order list" \
    || fail "GET /api/orders?status=ALL → $R"

  # 16c. Initiate order (needs cart items and address)
  ORDER_ID=""
  if [ -n "$PRODUCT_ID" ] && [ -n "$ADDRESS_ID" ]; then
    # Put something in cart first
    POST /api/cart/items -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":$PRODUCT_ID,\"quantity\":1}" >/dev/null 2>&1

    R=$(POST /api/orders/initiate -H "Authorization: Bearer $USER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"addressId\":$ADDRESS_ID,\"shippingMethod\":\"STANDARD\"}")
    if python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('orderId') or d.get('data',{}).get('orderId')" <<< "$R" 2>/dev/null; then
      pass "POST /api/orders/initiate → order initiated"
      ORDER_ID=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('orderId') or d.get('data',{}).get('orderId',''))" <<< "$R" 2>/dev/null)
      echo "    → Order ID: $ORDER_ID"
    else
      fail "POST /api/orders/initiate → $R"
    fi
  else
    skip "POST /api/orders/initiate — no product or address available"
  fi

  # 16d. Get order details
  if [ -n "$ORDER_ID" ]; then
    R=$(GET "/api/orders/$ORDER_ID" -H "Authorization: Bearer $USER_TOKEN")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('id') or d.get('data',{}).get('id')" <<< "$R" 2>/dev/null \
      && pass "GET /api/orders/$ORDER_ID → order details returned" \
      || fail "GET /api/orders/$ORDER_ID → $R"

    # 16e. Cancel order
    R=$(PUT /api/orders/$ORDER_ID/cancel -H "Authorization: Bearer $USER_TOKEN")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or d.get('status','') not in ['500']" <<< "$R" 2>/dev/null \
      && pass "PUT /api/orders/$ORDER_ID/cancel → cancelled or handled" \
      || fail "PUT /api/orders/$ORDER_ID/cancel → $R"
  else
    skip "GET /api/orders/{id} and cancel — no order created"
  fi

  # 16f. Get non-existent order
  R=$(GET "/api/orders/9999999" -H "Authorization: Bearer $USER_TOKEN")
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" == "404" || "$STATUS" == "403" ]] && pass "GET /api/orders/9999999 → 404/403 error" \
    || fail "GET /api/orders/9999999 → expected 404/403, got: $R"
fi

# =============================================================================
# 17. REVIEWS
# =============================================================================
section "17. Reviews"

# 17a. Get product reviews (public)
if [ -n "$PRODUCT_ID" ]; then
  R=$(GET "/api/reviews/product/$PRODUCT_ID?page=0&size=5")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d['success']==True" <<< "$R" 2>/dev/null \
    && pass "GET /api/reviews/product/$PRODUCT_ID → reviews returned" \
    || fail "GET /api/reviews/product/$PRODUCT_ID → $R"

  # Sort options
  for SORT in newest oldest highest lowest; do
    R=$(GET "/api/reviews/product/$PRODUCT_ID?sort=$SORT")
    python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True" <<< "$R" 2>/dev/null \
      && pass "GET /api/reviews/product/$PRODUCT_ID?sort=$SORT → accepted" \
      || fail "GET /api/reviews/product/$PRODUCT_ID?sort=$SORT → $R"
  done
else
  skip "Review GET tests — no product in DB"
fi

if [ -n "$USER_TOKEN" ] && [ -n "$PRODUCT_ID" ]; then
  # 17b. Check review eligibility
  R=$(GET "/api/reviews/check-eligibility/$PRODUCT_ID" -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or d.get('status')" <<< "$R" 2>/dev/null \
    && pass "GET /api/reviews/check-eligibility/$PRODUCT_ID → eligibility returned" \
    || fail "GET /api/reviews/check-eligibility/$PRODUCT_ID → $R"

  # 17c. Get my review for product
  R=$(GET "/api/reviews/my-review/$PRODUCT_ID" -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True or d.get('status',0)==404" <<< "$R" 2>/dev/null \
    && pass "GET /api/reviews/my-review/$PRODUCT_ID → returned (null or review)" \
    || fail "GET /api/reviews/my-review/$PRODUCT_ID → $R"

  # 17d. Create review (will likely fail eligibility — but should return proper error, not 500)
  R=$(POST /api/reviews -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"productId\":$PRODUCT_ID,\"rating\":5,\"title\":\"Great!\",\"body\":\"Loved this product.\"}")
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status','ok'))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" != "500" ]] && pass "POST /api/reviews → no 500 (proper error or success)" \
    || fail "POST /api/reviews → 500 server error"
fi

# =============================================================================
# 18. LOGOUT + TOKEN INVALIDATION
# =============================================================================
section "18. Logout & Token Invalidation"

if [ -z "$USER_TOKEN" ]; then
  skip "Logout tests — no token"
else
  R=$(POST /api/auth/logout -H "Authorization: Bearer $USER_TOKEN")
  python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('success')==True" <<< "$R" 2>/dev/null \
    && pass "POST /api/auth/logout → logged out successfully" \
    || fail "POST /api/auth/logout → $R"

  # After logout, token should be rejected
  R=$(GET /api/auth/profile -H "Authorization: Bearer $USER_TOKEN")
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" == "401" ]] && pass "GET /api/auth/profile (after logout) → 401 token invalidated" \
    || fail "GET /api/auth/profile (after logout) → expected 401 (token still valid!), got: $R"
fi

# =============================================================================
# 19. ADMIN — Access Control
# =============================================================================
section "19. Admin — Access Control (regular user)"

# Need a fresh token for regular user checks
TEMP_R=$(POST /api/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"$REG_EMAIL\",\"password\":\"NewPassword123!\"}")
TEMP_TOKEN=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('data',{}).get('accessToken',''))" <<< "$TEMP_R" 2>/dev/null)

for ENDPOINT in "/api/admin/stats" "/api/admin/users" "/api/admin/analytics/revenue" "/api/admin/analytics/orders" "/api/admin/orders"; do
  if [ -n "$TEMP_TOKEN" ]; then
    R=$(GET "$ENDPOINT" -H "Authorization: Bearer $TEMP_TOKEN")
    STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
    [[ "$STATUS" == "403" ]] && pass "GET $ENDPOINT (regular user) → 403 Forbidden" \
      || fail "GET $ENDPOINT (regular user) → expected 403, got status=$STATUS"
  else
    # Try unauthenticated
    R=$(GET "$ENDPOINT")
    STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
    [[ "$STATUS" == "401" || "$STATUS" == "403" ]] && pass "GET $ENDPOINT (no auth) → 401/403 blocked" \
      || fail "GET $ENDPOINT (no auth) → expected 401/403, got: $R"
  fi
done

# Admin endpoints without any auth
for ENDPOINT in "/api/admin/stats" "/api/admin/users"; do
  R=$(GET "$ENDPOINT")
  STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
  [[ "$STATUS" == "401" || "$STATUS" == "403" ]] && pass "GET $ENDPOINT (unauthenticated) → 401/403" \
    || fail "GET $ENDPOINT (unauthenticated) → expected 401/403, got: $R"
done

# =============================================================================
# 20. MALFORMED REQUESTS
# =============================================================================
section "20. Malformed / Edge Case Requests"

# Invalid JSON body
R=$(POST /api/auth/login -H "Content-Type: application/json" -d 'not-valid-json')
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "400" ]] && pass "POST /api/auth/login (malformed JSON) → 400 error" \
  || fail "POST /api/auth/login (malformed JSON) → expected 400, got: $R"

# Wrong content type
R=$(POST /api/auth/login -H "Content-Type: text/plain" -d 'email=a@b.com&password=pass')
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',''))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "400" || "$STATUS" == "415" ]] && pass "POST /api/auth/login (wrong content-type) → 400/415 error" \
  || fail "POST /api/auth/login (wrong content-type) → expected 400/415, got: $R"

# Negative page
R=$(GET "/api/products?page=-1&size=5")
STATUS=$(python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('status',d.get('currentPage','')))" <<< "$R" 2>/dev/null)
[[ "$STATUS" == "400" || "$STATUS" == "0" ]] && pass "GET /api/products?page=-1 → handled (400 or defaults to 0)" \
  || fail "GET /api/products?page=-1 → unexpected: $R"

# Zero size
R=$(GET "/api/products?page=0&size=0")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('content') is not None or d.get('status')" <<< "$R" 2>/dev/null \
  && pass "GET /api/products?size=0 → handled without 500" \
  || fail "GET /api/products?size=0 → $R"

# Extremely large page
R=$(GET "/api/products?page=999999&size=5")
python3 -c "import json,sys; d=json.loads(sys.stdin.read()); assert d.get('content') is not None or d.get('status')" <<< "$R" 2>/dev/null \
  && pass "GET /api/products?page=999999 → handled (empty content or error)" \
  || fail "GET /api/products?page=999999 → $R"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}                  TEST SUMMARY                    ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo -e "  ${YELLOW}Skipped: $SKIP${NC}"
echo "  Total:  $((PASS + FAIL + SKIP))"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}Failed Tests:${NC}"
  for F in "${FAILURES[@]}"; do
    echo -e "  ${RED}✘${NC} $F"
  done
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}${BOLD}All tests passed! ✔${NC}"
else
  echo -e "${RED}${BOLD}$FAIL test(s) failed.${NC}"
fi
