import { getDB } from '../index';
import { STORES } from '../schema';
import { Customer } from '../../types';

export class CustomerRepository {
  /**
   * Retrieve all customers from IndexedDB
   */
  async getAll(): Promise<Customer[]> {
    const db = await getDB();
    return await db.getAll(STORES.CUSTOMERS);
  }

  /**
   * Get single customer by ID
   */
  async getById(id: string): Promise<Customer | undefined> {
    const db = await getDB();
    return await db.get(STORES.CUSTOMERS, id);
  }

  /**
   * Get customer by tax number
   */
  async getByTaxNumber(taxNumber: string): Promise<Customer | undefined> {
    const db = await getDB();
    const cleanTax = taxNumber.trim();
    return await db.getFromIndex(STORES.CUSTOMERS, 'taxNumber', cleanTax);
  }

  /**
   * Get customer by phone number
   */
  async getByPhone(phone: string): Promise<Customer | undefined> {
    const db = await getDB();
    const cleanPhone = phone.trim();
    return await db.getFromIndex(STORES.CUSTOMERS, 'phone', cleanPhone);
  }

  /**
   * Search customers by query (name, tax number, phone, branch, card)
   */
  async search(query: string = ''): Promise<Customer[]> {
    const all = await this.getAll();
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return all;

    return all.filter((cust) => {
      const matchName = cust.name.toLowerCase().includes(cleanQuery);
      const matchTax = cust.taxNumber?.toLowerCase().includes(cleanQuery);
      const matchPhone = cust.phone?.toLowerCase().includes(cleanQuery);
      const matchBranch = cust.branchName?.toLowerCase().includes(cleanQuery);
      const matchCard = cust.cardNumber?.toLowerCase().includes(cleanQuery);

      return matchName || matchTax || matchPhone || matchBranch || matchCard;
    });
  }

  /**
   * Add or update a customer
   */
  async save(customer: Customer): Promise<Customer> {
    const db = await getDB();
    await db.put(STORES.CUSTOMERS, customer);

    // Keep localStorage in sync for backwards compatibility
    try {
      const all = await db.getAll(STORES.CUSTOMERS);
      localStorage.setItem('eda50_customers', JSON.stringify(all));
    } catch {
      // ignore
    }

    return customer;
  }

  /**
   * Delete customer by ID
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.CUSTOMERS, id);

    try {
      const all = await db.getAll(STORES.CUSTOMERS);
      localStorage.setItem('eda50_customers', JSON.stringify(all));
    } catch {
      // ignore
    }
  }

  /**
   * Update customer ledger balance
   */
  async updateBalance(id: string, delta: number): Promise<Customer | undefined> {
    const db = await getDB();
    const tx = db.transaction(STORES.CUSTOMERS, 'readwrite');
    const customer = await tx.store.get(id);

    if (!customer) {
      await tx.done;
      return undefined;
    }

    customer.currentBalance = (customer.currentBalance || 0) + delta;
    await tx.store.put(customer);
    await tx.done;

    return customer;
  }
}

export const customerRepository = new CustomerRepository();
