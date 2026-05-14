#!/bin/bash
BASE=http://localhost:8000
PASS=0; FAIL=0

check() {
  local desc=$1; local result=$2; local expect=$3
  if echo "$result" | grep -q "$expect"; then
    echo "✅ PASS: $desc"; ((PASS++))
  else
    echo "❌ FAIL: $desc (got: $result)"; ((FAIL++))
  fi
}

# 1. 註冊兩個用戶
curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"isolate_a@test.com","password":"passA123"}' > /dev/null
curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"isolate_b@test.com","password":"passB123"}' > /dev/null

# 2. 登入取 token
TOKEN_A=$(curl -s -X POST $BASE/api/auth/login \
  -d "username=isolate_a@test.com&password=passA123" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
TOKEN_B=$(curl -s -X POST $BASE/api/auth/login \
  -d "username=isolate_b@test.com&password=passB123" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

check "userA 登入取得 token" "$TOKEN_A" "ey"
check "userB 登入取得 token" "$TOKEN_B" "ey"

# 3. 建立各自的 org
ORG_A=$(curl -s -X POST $BASE/api/organizations -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" -d '{"name":"OrgA","tax_id":"TA001"}')
ORG_B=$(curl -s -X POST $BASE/api/organizations -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" -d '{"name":"OrgB","tax_id":"TB001"}')
ORG_A_ID=$(echo $ORG_A | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
ORG_B_ID=$(echo $ORG_B | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

check "userA 建立 OrgA 成功" "$ORG_A" "OrgA"
check "userB 建立 OrgB 成功" "$ORG_B" "OrgB"

# 4. [隔離測試] userA GET orgs → 只看到 OrgA
ORGS_A=$(curl -s $BASE/api/organizations -H "Authorization: Bearer $TOKEN_A")
check "userA 只看到 OrgA" "$ORGS_A" "OrgA"
if echo "$ORGS_A" | grep -q "OrgB"; then
  echo "❌ FAIL: userA 不應看到 OrgB（資料洩漏！）"; ((FAIL++))
else
  echo "✅ PASS: userA 看不到 OrgB"; ((PASS++))
fi

# 5. [隔離測試] userB GET orgs → 只看到 OrgB
ORGS_B=$(curl -s $BASE/api/organizations -H "Authorization: Bearer $TOKEN_B")
check "userB 只看到 OrgB" "$ORGS_B" "OrgB"
if echo "$ORGS_B" | grep -q "OrgA"; then
  echo "❌ FAIL: userB 不應看到 OrgA（資料洩漏！）"; ((FAIL++))
else
  echo "✅ PASS: userB 看不到 OrgA"; ((PASS++))
fi

# 6. [越權測試] userB 對 OrgA 建立 facility → 應 404
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  $BASE/api/organizations/$ORG_A_ID/facilities \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN_B" \
  -d '{"name":"BadFacility"}')
check "userB 越權存取 OrgA → 404" "$STATUS" "404"

# 7. [越權測試] 無 token 存取 → 應 401
STATUS_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/organizations)
check "無 token 存取 → 401" "$STATUS_NOAUTH" "401"

echo ""
echo "=============================="
echo "結果：PASS $PASS / FAIL $FAIL / 總計 $((PASS+FAIL))"
echo "=============================="
