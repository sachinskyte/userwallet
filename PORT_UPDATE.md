# Port Update: Backend Changed to 3004

## ✅ Fixed

I've updated both API clients to use port **3004** as the default:

1. ✅ `src/lib/api.ts` - Updated default to `http://localhost:3004`
2. ✅ `govweb/src/lib/api.ts` - Updated default to `http://localhost:3004`

## 📝 Manual Update Required

Since `.env` files are protected, please manually update:

### 1. Root `.env` file:
```env
VITE_BACKEND_URL=http://localhost:3004
```

### 2. `govweb/.env` file (create if doesn't exist):
```env
VITE_BACKEND_URL=http://localhost:3004
```

## 🔄 After Updating

1. **Restart frontend dev servers:**
   ```bash
   # Stop current dev server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **For govweb:**
   ```bash
   cd govweb
   npm run dev
   ```

## ✅ Verification

After restarting, the frontend should now connect to:
- `http://localhost:3004/api/apply`
- `http://localhost:3004/api/applications`
- `http://localhost:3004/api/status`

The error should be resolved! 🎉

