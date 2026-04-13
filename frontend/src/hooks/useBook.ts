import useSWR from "swr";
import api from "@/lib/axios";
import { Book, BookBanner } from "@/types/book.type";

const getBestSellingBooks = async (): Promise<BookBanner[]> => {
  const response = await api.get<BookBanner[]>("/orders/best-selling");
  return response.data;
};

const getNewestBooks = async (): Promise<Book[]> => {
  const response = await api.get<Book[]>("/orders/newest");
  return response.data;
};

export function useTop10BestSellingBooks() {
  const { data, error, isLoading, mutate } = useSWR(
    "/orders/best-selling",
    getBestSellingBooks,
  );
  return {
    bestSelling: data,
    error,
    isLoading,
    mutate,
  };
}
export function useTop10NewestBooks() {
  const { data, error, isLoading, mutate } = useSWR(
    "/orders/newest",
    getNewestBooks,
  );
  return {
    newest: data,
    error,
    isLoading,
    mutate,
  };
}
