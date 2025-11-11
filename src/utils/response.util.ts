// Response utility functions for consistent API responses

export interface BaseResponse {
  success: boolean;
  message: string;
  object: any | null;
  errors: string[] | null;
}

export interface PaginatedResponse {
  success: boolean;
  message: string;
  object: any[];
  pageNumber: number;
  pageSize: number;
  totalSize: number;
  errors: string[] | null;
}

//User Story 5: Product list pagination response format

export interface ProductListResponse {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalProducts: number;
  products: any[];
}

//  a base response object

/**
 * Create a standardized API response envelope.
 */
export const createBaseResponse = (
  success: boolean,
  message: string,
  data: any | null = null,
  errors: string[] | null = null
): BaseResponse => {
  return {
    success,
    message,
    object: data,
    errors,
  };
};

//  a paginated response object

/**
 * Create a standardized paginated API response envelope.
 */
export const createPaginatedResponse = (
  success: boolean,
  message: string,
  data: any[] = [],
  pageNumber: number = 1,
  pageSize: number = 10,
  totalSize: number = 0,
  errors: string[] | null = null
): PaginatedResponse => {
  return {
    success,
    message,
    object: data,
    pageNumber,
    pageSize,
    totalSize,
    errors,
  };
};

// a success response

/**
 * Convenience helper for a successful response.
 */
export const successResponse = (message: string, data: any | null = null): BaseResponse => {
  return createBaseResponse(true, message, data, null);
};

// an error response

/**
 * Convenience helper for an error response.
 */
export const errorResponse = (message: string, errors: string[] | null = null): BaseResponse => {
  return createBaseResponse(false, message, null, errors);
};

//  a product list response (User Story 5)

/**
 * Build the product list response shape with pagination metadata.
 */
export const createProductListResponse = (
  products: any[],
  currentPage: number,
  pageSize: number,
  totalProducts: number
): ProductListResponse => {
  const totalPages = Math.ceil(totalProducts / pageSize);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalProducts,
    products,
  };
};
