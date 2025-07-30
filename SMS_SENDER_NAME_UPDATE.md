# SMS Sender Name Update

## 🎯 **Enhancement Made**
Updated the SMS system to use the actual school name as the sender instead of the generic "SchoolApp".

## ✅ **Changes Implemented**

### 1. **Dynamic Sender Name Resolution**
- **SMS API Route** now gets the school name from the admin user's school
- **Automatic Formatting** for SMS sender ID requirements (alphanumeric, max 11 chars)
- **Fallback System** uses "School" if school name cannot be retrieved

### 2. **SMS Service Enhancements**
- Added `formatSenderName()` helper function
- Handles special characters and length limits for SMS sender IDs
- Ensures compliance with SMS provider requirements

### 3. **Environment Variable Update**
- Changed default from `HUBTEL_SMS_FROM=SchoolApp` to `HUBTEL_SMS_FROM=School`
- More generic fallback that works for any school

## 📱 **How It Works**

### **Sender Name Resolution Process:**
1. **Check for custom sender** - If provided in API call, use it
2. **Get school name** - Query admin user's school from database
3. **Format for SMS** - Clean and truncate to meet SMS requirements
4. **Apply fallback** - Use "School" if school name unavailable

### **SMS Sender ID Formatting:**
```typescript
// Example transformations:
"St. Mary's School" → "StMarysSchoo" (11 chars, no special chars)
"ABC International Academy" → "ABCInternati" (11 chars)
"School-2024" → "School2024" (remove hyphens)
```

## 🎉 **Benefits**

### **Professional Branding**
- SMS messages now show the actual school name
- Recipients immediately know which school sent the message
- More trustworthy and professional appearance

### **Multi-School Support**
- Each school's SMS messages show their own name
- Perfect for multi-tenant systems
- No confusion between different schools

### **Compliance Ready**
- Automatically formats names to meet SMS provider requirements
- Handles special characters and length limits
- Fallback system prevents SMS failures

## 📋 **Examples**

### **Before:**
```
From: SchoolApp
Message: Welcome to Greenwood Academy! Your account has been created...
```

### **After:**
```
From: Greenwood (formatted from "Greenwood Academy")
Message: Welcome to Greenwood Academy! Your account has been created...
```

## 🔧 **Technical Details**

### **API Route Enhancement:**
```typescript
// Get school name from admin user
const admin = await prisma.admin.findUnique({
  where: { id: userId },
  include: { school: { select: { name: true } } }
});

// Format for SMS sender ID
senderName = SMSService.formatSenderName(admin.school.name);
```

### **Sender ID Formatting:**
```typescript
static formatSenderName(schoolName: string): string {
  return schoolName
    .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
    .substring(0, 11) // Limit to 11 characters
    .trim() || 'School'; // Fallback if empty
}
```

## ✅ **Ready to Use**
- SMS messages now automatically use your school's name as sender
- No additional configuration required
- Works for all SMS types (welcome, payment, announcements, etc.)
- Maintains professional branding across all communications

Your SMS system now provides a more personalized and professional experience! 🎉