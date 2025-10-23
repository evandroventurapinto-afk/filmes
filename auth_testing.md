# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,  // Pydantic uses 'id', MongoDB stores as '_id'
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,  // Must match user.id exactly
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "https://your-app.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test protected endpoints
curl -X GET "https://your-app.com/api/movies" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

curl -X POST "https://your-app.com/api/favorites" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"movie_id": "test123"}'
```

## Step 3: Browser Testing
```javascript
// Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "your-app.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
}]);
await page.goto("https://your-app.com");
```

## Critical Fix: ID Schema

### MongoDB + Pydantic ID Mapping:
```python
# Pydantic Model (uses 'id')
class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    
    class Config:
        populate_by_name = True
```

### Insert with proper field names:
```javascript
// MongoDB stores as '_id' but insert using 'id'
db.users.insertOne({ 
  id: "user-123",  // Will be stored as '_id'
  email: "test@example.com" 
});

// Session references user
db.user_sessions.insertOne({ 
  user_id: "user-123",  // Matches user.id/_id
  session_token: "token-xyz" 
});
```

## Quick Debug
```bash
# Check data format
mongosh --eval "
use('test_database');
db.users.find().limit(2).pretty();
db.user_sessions.find().limit(2).pretty();
"

# Clean test data
mongosh --eval "
use('test_database');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Checklist
- [ ] User document has id field (stored as _id in MongoDB)
- [ ] Session user_id matches user's id value exactly
- [ ] Both use string IDs (not ObjectId)
- [ ] Pydantic models handle id/_id mapping via Field(alias="_id")
- [ ] Backend queries use correct field names
- [ ] API returns user data (not 401/404)
- [ ] Browser loads dashboard (not login page)

## Success Indicators
✅ /api/auth/me returns user data
✅ Dashboard loads without redirect
✅ CRUD operations work

## Failure Indicators
❌ "User not found" errors
❌ 401 Unauthorized responses
❌ Redirect to login page
