/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *         headers:
 *           Set-Cookie:
 *             description: Sets access and refresh tokens as HTTP-only cookies
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *         headers:
 *           Set-Cookie:
 *             description: Sets access and refresh tokens as HTTP-only cookies
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *         headers:
 *           Set-Cookie:
 *             description: Sets new access and refresh tokens
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Logged out successfully"
 */

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "If the email exists, a password reset link has been sent"
 */

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Password reset successful"
 *       400:
 *         description: Invalid token or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/users/me/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       $ref: '#/components/schemas/UsageStats'
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Account deleted successfully"
 */

/**
 * @swagger
 * /api/v1/albums:
 *   post:
 *     summary: Create a new album
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAlbumRequest'
 *     responses:
 *       201:
 *         description: Album created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     album:
 *                       $ref: '#/components/schemas/Album'
 */

/**
 * @swagger
 * /api/v1/albums:
 *   get:
 *     summary: List user's albums
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ARCHIVED, DELETED]
 *         description: Filter by album status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Albums retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     albums:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Album'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         total:
 *                           type: number
 */

/**
 * @swagger
 * /api/v1/albums/{id}:
 *   get:
 *     summary: Get album by ID
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     album:
 *                       $ref: '#/components/schemas/Album'
 *       404:
 *         description: Album not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/v1/albums/{id}:
 *   put:
 *     summary: Update album
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAlbumRequest'
 *     responses:
 *       200:
 *         description: Album updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     album:
 *                       $ref: '#/components/schemas/Album'
 */

/**
 * @swagger
 * /api/v1/albums/{id}:
 *   delete:
 *     summary: Delete album
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Album deleted successfully"
 */

/**
 * @swagger
 * /api/v1/albums/{id}/archive:
 *   post:
 *     summary: Archive album
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album archived successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/restore:
 *   post:
 *     summary: Restore archived album
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album restored successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/access-codes/generate:
 *   post:
 *     summary: Generate access code for album
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Access code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessCode:
 *                       $ref: '#/components/schemas/AccessCode'
 */

/**
 * @swagger
 * /api/v1/albums/{id}/access-codes:
 *   get:
 *     summary: List album access codes
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Access codes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessCodes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AccessCode'
 */

/**
 * @swagger
 * /api/v1/albums/{id}/access-codes/blacklist:
 *   post:
 *     summary: Blacklist an access code
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codeId]
 *             properties:
 *               codeId:
 *                 type: string
 *                 format: uuid
 *                 description: Access code ID to blacklist
 *     responses:
 *       200:
 *         description: Access code blacklisted successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/access-codes/unblacklist:
 *   post:
 *     summary: Unblacklist an access code
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codeId]
 *             properties:
 *               codeId:
 *                 type: string
 *                 format: uuid
 *                 description: Access code ID to unblacklist
 *     responses:
 *       200:
 *         description: Access code unblacklisted successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/access-codes:
 *   delete:
 *     summary: Delete an access code
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *       - in: query
 *         name: codeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Access code ID to delete
 *     responses:
 *       200:
 *         description: Access code deleted successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/regenerate-identifiers:
 *   post:
 *     summary: Regenerate album viewer hash and QR code
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Identifiers regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     album:
 *                       $ref: '#/components/schemas/Album'
 */

/**
 * @swagger
 * /api/v1/albums/{albumId}/media:
 *   get:
 *     summary: List media in album
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Media list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     media:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Media'
 */

/**
 * @swagger
 * /api/v1/albums/{id}/contributors:
 *   get:
 *     summary: Get album contributors
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Contributors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     contributors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           mediaCount:
 *                             type: number
 */

/**
 * @swagger
 * /api/v1/albums/{id}/sessions:
 *   get:
 *     summary: List album sessions
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           isBlacklisted:
 *                             type: boolean
 */

/**
 * @swagger
 * /api/v1/albums/{id}/sessions/revoke:
 *   post:
 *     summary: Revoke album session
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session ID to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/sessions/blacklist:
 *   post:
 *     summary: Blacklist album session
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session ID to blacklist
 *     responses:
 *       200:
 *         description: Session blacklisted successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/sessions/unblacklist:
 *   post:
 *     summary: Unblacklist album session
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session ID to unblacklist
 *     responses:
 *       200:
 *         description: Session unblacklisted successfully
 */

/**
 * @swagger
 * /api/v1/albums/{id}/media-urls:
 *   get:
 *     summary: Get album media URLs
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Media URLs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     mediaUrls:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           url:
 *                             type: string
 *                             format: uri
 *                           thumbnailUrl:
 *                             type: string
 *                             format: uri
 *                             nullable: true
 */

/**
 * @swagger
 * /api/v1/albums/{id}/analytics:
 *   get:
 *     summary: Get album analytics
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     analytics:
 *                       type: object
 *                       description: Album analytics data
 */

/**
 * @swagger
 * /api/v1/albums/{id}/stats:
 *   get:
 *     summary: Get album statistics
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       description: Album statistics
 */

/**
 * @swagger
 * /api/v1/albums/{id}/activity:
 *   get:
 *     summary: Get recent album activity
 *     tags: [Albums]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     activity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Activity log entry
 */

/**
 * @swagger
 * /api/v1/media/initiate:
 *   post:
 *     summary: Initiate media upload
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiateUploadRequest'
 *     responses:
 *       200:
 *         description: Upload initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     mediaId:
 *                       type: string
 *                       format: uuid
 *                       description: Media ID for upload
 *                     uploadUrl:
 *                       type: string
 *                       format: uri
 *                       description: Presigned upload URL (for S3) or upload endpoint
 *                     fields:
 *                       type: object
 *                       description: Additional fields for multipart upload (if applicable)
 */

/**
 * @swagger
 * /api/v1/media/{id}/confirm:
 *   post:
 *     summary: Confirm media upload completion
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Upload confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     media:
 *                       $ref: '#/components/schemas/Media'
 */

/**
 * @swagger
 * /api/v1/media/{id}/cancel:
 *   post:
 *     summary: Cancel media upload
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Upload cancelled successfully
 */

/**
 * @swagger
 * /api/v1/media/{id}:
 *   get:
 *     summary: Get media by ID
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     media:
 *                       $ref: '#/components/schemas/Media'
 */

/**
 * @swagger
 * /api/v1/media/{id}:
 *   delete:
 *     summary: Delete media
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media deleted successfully
 */

/**
 * @swagger
 * /api/v1/media/{id}/caption:
 *   patch:
 *     summary: Update media caption
 *     tags: [Media]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCaptionRequest'
 *     responses:
 *       200:
 *         description: Caption updated successfully
 */

/**
 * @swagger
 * /api/v1/media/{id}/reactions:
 *   post:
 *     summary: Add reaction to media
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddReactionRequest'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *       - in: header
 *         name: x-session-token
 *         schema:
 *           type: string
 *         description: Session token for public access (optional)
 *     responses:
 *       200:
 *         description: Reaction added successfully
 */

/**
 * @swagger
 * /api/v1/media/{id}/reactions/{emoji}:
 *   delete:
 *     summary: Remove reaction from media
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *       - in: path
 *         name: emoji
 *         required: true
 *         schema:
 *           type: string
 *         description: Emoji to remove
 *       - in: header
 *         name: x-session-token
 *         schema:
 *           type: string
 *         description: Session token for public access (optional)
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 */

/**
 * @swagger
 * /api/v1/media/{id}/reactions:
 *   get:
 *     summary: Get media reactions
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media ID
 *       - in: header
 *         name: x-session-token
 *         schema:
 *           type: string
 *         description: Session token for public access (optional)
 *     responses:
 *       200:
 *         description: Reactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     reactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Reaction'
 */

/**
 * @swagger
 * /api/v1/subscriptions/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Subscriptions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     plans:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubscriptionPlan'
 */

/**
 * @swagger
 * /api/v1/subscriptions/current:
 *   get:
 *     summary: Get current subscription
 *     tags: [Subscriptions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 */

/**
 * @swagger
 * /api/v1/subscriptions/usage:
 *   get:
 *     summary: Get usage statistics
 *     tags: [Subscriptions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     usage:
 *                       $ref: '#/components/schemas/UsageStats'
 */

/**
 * @swagger
 * /api/v1/subscriptions/limits:
 *   get:
 *     summary: Get subscription limits
 *     tags: [Subscriptions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Limits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     limits:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 */

/**
 * @swagger
 * /api/v1/subscriptions/checkout:
 *   post:
 *     summary: Create checkout session
 *     tags: [Subscriptions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCheckoutSessionRequest'
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkoutUrl:
 *                       type: string
 *                       format: uri
 *                       description: Payment checkout URL
 */

/**
 * @swagger
 * /api/v1/subscriptions/switch:
 *   post:
 *     summary: Switch subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SwitchPlanRequest'
 *     responses:
 *       200:
 *         description: Plan switched successfully
 */

/**
 * @swagger
 * /api/v1/subscriptions/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscriptions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 */

/**
 * @swagger
 * /api/v1/public/album/{id}:
 *   get:
 *     summary: Get public album by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Album viewer hash (not UUID)
 *     responses:
 *       200:
 *         description: Album retrieved successfully
 *       403:
 *         description: Album is private and requires access code
 */

/**
 * @swagger
 * /api/v1/public/album/{id}/verify-access:
 *   post:
 *     summary: Verify access code for private album
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Album viewer hash
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyAccessRequest'
 *     responses:
 *       200:
 *         description: Access granted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionToken:
 *                       type: string
 *                       description: Session token for accessing album
 *       403:
 *         description: Invalid access code
 */

/**
 * @swagger
 * /api/v1/public/album/{id}/media:
 *   get:
 *     summary: Get media from public album
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Album viewer hash
 *       - in: header
 *         name: x-session-token
 *         schema:
 *           type: string
 *         description: Session token (required for private albums)
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 */

/**
 * @swagger
 * /api/v1/public/albums:
 *   get:
 *     summary: Get public albums
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Public albums retrieved successfully
 */

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Create contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContactMessageRequest'
 *     responses:
 *       201:
 *         description: Contact message created successfully
 */

/**
 * @swagger
 * /api/v1/contact:
 *   get:
 *     summary: List contact messages (admin only)
 *     tags: [Contact]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Contact messages retrieved successfully
 */

/**
 * @swagger
 * /api/v1/special-request:
 *   post:
 *     summary: Create special request
 *     tags: [Special Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSpecialRequestRequest'
 *     responses:
 *       201:
 *         description: Special request created successfully
 */

/**
 * @swagger
 * /api/v1/webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */

/**
 * @swagger
 * /api/v1/webhooks/paystack:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Paystack webhook event
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: "dots-memory-backend"
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 */

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Service is degraded
 */

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */

