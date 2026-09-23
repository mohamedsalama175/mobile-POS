import { useState, useEffect, useCallback } from 'react';
import { Customer } from '../../../types';
import { customerRepository } from '../../../db/repositories/customerRepository';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await customerRepository.search(searchQuery);
      setCustomers(items);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err?.message || 'فشل في تحميل العملاء من قاعدة البيانات المحلية');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createCustomer = async (data: Omit<Customer, 'id'>) => {
    try {
      const newCustomer: Customer = {
        ...data,
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      await customerRepository.save(newCustomer);
      await loadData();
      return newCustomer;
    } catch (err: any) {
      throw new Error(err?.message || 'فشل في حفظ بيانات العميل');
    }
  };

  const updateCustomer = async (customer: Customer) => {
    try {
      await customerRepository.save(customer);
      await loadData();
      return customer;
    } catch (err: any) {
      throw new Error(err?.message || 'فشل في تحديث بيانات العميل');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customerRepository.delete(id);
      await loadData();
    } catch (err: any) {
      throw new Error(err?.message || 'فشل في حذف العميل');
    }
  };

  return {
    customers,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refresh: loadData,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
