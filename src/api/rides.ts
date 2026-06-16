import client from './client'

/** Passenger ride request — Fiber: POST /logistics/passenger/rides/ */
export type RideRequestPayload = {
  pickup_address: string
  dropoff_address: string
  rider_notes?: string
  vehicle_type?: string
  payment_method?: string
  pickup_lat?: number
  pickup_lng?: number
  dropoff_lat?: number
  dropoff_lng?: number
}

export const ridesApi = {
  /** Quote before booking: GET /logistics/passenger/quote/ */
  getQuote(params: {
    pickup_lat: number
    pickup_lng: number
    dropoff_lat: number
    dropoff_lng: number
  }) {
    return client.get('/logistics/passenger/quote/', { params })
  },
  requestRide(payload: RideRequestPayload) {
    return client.post<{ id?: number; message?: string }>(
      '/logistics/passenger/rides/',
      payload,
    )
  },
}
