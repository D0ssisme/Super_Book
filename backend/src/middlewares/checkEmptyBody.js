export function checkEmptyBody(req, res, next) {
  const methodWithoutBody = ['GET', 'DELETE'];
  console.log(`[checkEmptyBody] ${req.method} ${req.path} - ContentType: ${req.get('content-type')} - Body keys: ${req.body ? Object.keys(req.body) : 'NO BODY'}`);
  
  if (methodWithoutBody.includes(req.method)){
    return next();
  }

  // For application/json requests
  if (req.is('application/json')){
    if (!req.body || Object.keys(req.body).length === 0){
      console.log(`[checkEmptyBody] REJECT: Empty JSON body`);
      return res.status(400).json({ message: 'Request body cannot be empty' });
    }
    console.log(`[checkEmptyBody] PASS: Valid JSON body with keys:`, Object.keys(req.body));
    return next();
  }

  // For multipart/form-data requests
  if (req.is('multipart/form-data')) {
    const hasBody = req.body && Object.keys(req.body).length > 0;
    const hasFiles = (req.file && Object.keys(req.file).length > 0) ||
      (req.files && Object.keys(req.files).length > 0);

    if (!hasBody && !hasFiles) {
      console.log(`[checkEmptyBody] REJECT: Empty multipart`);
      return res.status(400).json({ message: 'Request cannot be empty' });
    }
    console.log(`[checkEmptyBody] PASS: Valid multipart`);
    return next();
  }

  // For other content types, just allow through (body parsing handled by express middleware)
  console.log(`[checkEmptyBody] PASS: Other content type, allowing through`);
  next();
}