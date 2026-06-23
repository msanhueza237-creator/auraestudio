'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  createStockMovement
} from '@/actions/productos.actions';
import { ProductSchema, type ProductFormInput } from '@/lib/validations/producto.schema';
import { APP_CURRENCY_SYMBOL, formatCurrency } from '@/lib/currency';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import EmptyState from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  ArrowUpRight, 
  X 
} from 'lucide-react';

export default function ProductosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals & triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Stock movement local states
  const [moveType, setMoveType] = useState<'purchase' | 'adjustment' | 'return' | 'waste'>('purchase');
  const [moveDirection, setMoveDirection] = useState<'increase' | 'decrease'>('increase');
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [moveCost, setMoveCost] = useState<number>(0);
  const [moveNotes, setMoveNotes] = useState('');
  const [moveRef, setMoveRef] = useState('');

  // Proportional calculator local states
  const [useCostCalculator, setUseCostCalculator] = useState(false);
  const [calcCapacity, setCalcCapacity] = useState<string>('');
  const [calcTotalCost, setCalcTotalCost] = useState<string>('');

  const [stockUseCalculator, setStockUseCalculator] = useState(false);
  const [stockCalcCapacity, setStockCalcCapacity] = useState<string>('');
  const [stockCalcTotalCost, setStockCalcTotalCost] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: '',
      brand: '',
      category: '',
      sku: '',
      unit: 'ml',
      unit_cost: 0,
      current_stock: 0,
      minimum_stock: 0,
      supplier: '',
      is_active: true,
    },
  });

  // Calculate unit_cost for new/edit drawer
  useEffect(() => {
    const capacity = parseFloat(calcCapacity);
    const totalCost = parseFloat(calcTotalCost);
    if (!isNaN(capacity) && capacity > 0 && !isNaN(totalCost) && totalCost >= 0) {
      const calculatedUnitCost = totalCost / capacity;
      setValue('unit_cost', parseFloat(calculatedUnitCost.toFixed(4)));
    }
  }, [calcCapacity, calcTotalCost, setValue]);

  // Calculate unit_cost for stock purchase movement
  useEffect(() => {
    const capacity = parseFloat(stockCalcCapacity);
    const totalCost = parseFloat(stockCalcTotalCost);
    if (!isNaN(capacity) && capacity > 0 && !isNaN(totalCost) && totalCost >= 0) {
      const calculatedUnitCost = totalCost / capacity;
      setMoveCost(parseFloat(calculatedUnitCost.toFixed(4)));
    }
  }, [stockCalcCapacity, stockCalcTotalCost]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(search);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setUseCostCalculator(false);
    setCalcCapacity('');
    setCalcTotalCost('');
    reset({
      name: '',
      brand: '',
      category: '',
      sku: '',
      unit: 'ml',
      unit_cost: 0,
      current_stock: 0,
      minimum_stock: 0,
      supplier: '',
      is_active: true,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setUseCostCalculator(false);
    setCalcCapacity('');
    setCalcTotalCost('');
    reset({
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      sku: product.sku || '',
      unit: product.unit,
      unit_cost: Number(product.unit_cost),
      current_stock: Number(product.current_stock),
      minimum_stock: Number(product.minimum_stock),
      supplier: product.supplier || '',
      is_active: product.is_active,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ProductFormInput) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data);
      }
      setIsFormOpen(false);
      loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el producto');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenStockAdjustment = (product: any) => {
    setSelectedProduct(product);
    setMoveType('purchase');
    setMoveDirection('increase');
    setMoveQuantity(1);
    setMoveCost(Number(product.unit_cost));
    setMoveNotes('');
    setMoveRef('');
    setFormError(null);
    setStockUseCalculator(false);
    setStockCalcCapacity('');
    setStockCalcTotalCost('');
    setIsStockOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setFormLoading(true);
    setFormError(null);
    try {
      await createStockMovement({
        product_id: selectedProduct.id,
        movement_type: moveType,
        quantity: moveQuantity,
        direction: moveDirection,
        unit_cost: moveType === 'purchase' ? moveCost : undefined,
        reference: moveRef,
        notes: moveNotes,
      });
      setIsStockOpen(false);
      loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar el movimiento de stock');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setFormLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el producto');
    } finally {
      setFormLoading(false);
    }
  };

  // Helper logic to pre-select direction based on movement type
  const handleMoveTypeChange = (type: any) => {
    setMoveType(type);
    if (type === 'purchase' || type === 'return') {
      setMoveDirection('increase');
    } else if (type === 'usage' || type === 'waste') {
      setMoveDirection('decrease');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-dark">Stock de Productos</h2>
          <p className="text-sm text-stone-500">
            Controla el inventario de champús, tintes y materiales de tu salón de belleza
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 border border-brand-border rounded-xl shadow-sm flex items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg bg-stone-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm text-brand-dark"
          />
        </div>
      </div>

      {/* Products list/table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "Sin resultados" : "No hay productos"}
          description={search ? "Prueba a buscar con otro nombre o palabra clave." : "Comienza agregando tu primer artículo (ej. Tinte L'Oréal 7.1, Champú Kérastase)."}
          actionLabel={search ? undefined : "Agregar Producto"}
          onAction={search ? undefined : handleOpenCreate}
        />
      ) : (
        <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-cream/10 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <th className="px-6 py-4">Nombre / SKU</th>
                  <th className="px-6 py-4">Marca & Categoría</th>
                  <th className="px-6 py-4">Costo Unitario</th>
                  <th className="px-6 py-4">Stock Actual</th>
                  <th className="px-6 py-4">Stock Mínimo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {products.map((product) => {
                  const isLowStock = Number(product.current_stock) <= Number(product.minimum_stock);

                  return (
                    <tr key={product.id} className="hover:bg-brand-cream/5 text-sm transition-colors">
                      {/* Name / SKU */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand-primary border border-brand-border">
                            <Package className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-brand-dark">{product.name}</p>
                            <p className="text-xs text-stone-400">
                              SKU: {product.sku || 'Sin SKU'}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Brand & Category */}
                      <td className="px-6 py-4 text-stone-600">
                        <p className="font-medium">{product.brand || '-'}</p>
                        <p className="text-xs text-stone-400">{product.category || '-'}</p>
                      </td>
                      {/* Unit Cost */}
                      <td className="px-6 py-4 font-semibold text-brand-dark">
                        {formatCurrency(product.unit_cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {/* Current Stock */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${isLowStock ? 'text-red-600 font-bold' : 'text-stone-700'}`}>
                            {product.current_stock} {product.unit}
                          </span>
                          {isLowStock && (
                            <span 
                              className="text-red-500 hover:text-red-600" 
                              title="¡Alerta! Stock por debajo del mínimo"
                            >
                              <AlertTriangle className="w-4.5 h-4.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Minimum Stock */}
                      <td className="px-6 py-4 text-stone-500">
                        {product.minimum_stock} {product.unit}
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          product.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-stone-50 text-stone-500 border border-stone-100'
                        }`}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2.5">
                          <button
                            onClick={() => handleOpenStockAdjustment(product)}
                            className="p-1.5 text-stone-500 hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                            title="Ajustar Stock"
                          >
                            <ArrowUpRight className="w-4.5 h-4.5" />
                            <span className="text-xs hidden lg:inline">Stock</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-stone-500 hover:text-brand-primary hover:bg-brand-light rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsFormOpen(false)}
          />
          
          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-up md:animate-fade-in border-l border-brand-border">
            {/* Header */}
            <div className="h-16 border-b border-brand-border flex items-center justify-between px-6 bg-brand-cream/20">
              <h3 className="font-serif text-lg font-bold text-brand-dark">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-brand-light rounded-lg text-stone-400 hover:text-brand-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-grow flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Champú Reparador Kérastase"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.name ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Kérastase / L'Oréal"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('brand')}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Champús, Tintes, Tratamientos"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('category')}
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    SKU (Código único)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. P-10293"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('sku')}
                  />
                </div>

                {/* Unit */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Unidad de Medida *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark ${
                      errors.unit ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('unit')}
                  >
                    <option value="ml">Mililitros (ml)</option>
                    <option value="unidades">Unidades (ud)</option>
                    <option value="gr">Gramos (g)</option>
                  </select>
                </div>

                {/* Cost Calculator Helper */}
                <div className="bg-stone-50 p-3.5 border border-brand-border rounded-xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use_calculator"
                      checked={useCostCalculator}
                      onChange={(e) => {
                        setUseCostCalculator(e.target.checked);
                        if (!e.target.checked) {
                          setCalcCapacity('');
                          setCalcTotalCost('');
                        }
                      }}
                      className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="use_calculator" className="text-xs font-semibold text-brand-dark uppercase tracking-wider cursor-pointer">
                      Calcular costo por envase/capacidad
                    </label>
                  </div>

                  {useCostCalculator && (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-400 uppercase font-semibold">
                          Capacidad del envase ({watch('unit') || 'ml'})
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Ej. 700"
                          value={calcCapacity}
                          onChange={(e) => setCalcCapacity(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-brand-border rounded bg-white text-xs text-brand-dark focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-400 uppercase font-semibold">
                          Costo del envase total ({APP_CURRENCY_SYMBOL})
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Ej. 10000"
                          value={calcTotalCost}
                          onChange={(e) => setCalcTotalCost(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-brand-border rounded bg-white text-xs text-brand-dark focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Unit Cost */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Costo Unitario ({APP_CURRENCY_SYMBOL}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 text-sm">{APP_CURRENCY_SYMBOL}</span>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="0.00"
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                        errors.unit_cost ? 'border-red-500' : 'border-brand-border'
                      }`}
                      {...register('unit_cost', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.unit_cost && (
                    <p className="text-xs text-red-600">{errors.unit_cost.message}</p>
                  )}
                </div>

                {/* Current Stock */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0"
                    disabled={!!editingProduct}
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.current_stock ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('current_stock', { valueAsNumber: true })}
                  />
                  {errors.current_stock && (
                    <p className="text-xs text-red-600">{errors.current_stock.message}</p>
                  )}
                  {editingProduct && (
                    <p className="text-[11px] text-stone-400 leading-normal">
                      Para productos existentes, por favor usa el botón "Ajustar Stock" en la tabla para registrar ingresos, mermas o recuentos.
                    </p>
                  )}
                </div>

                {/* Minimum Stock */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Stock Mínimo (Límite alerta) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0"
                    className={`w-full px-3 py-2 border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                      errors.minimum_stock ? 'border-red-500' : 'border-brand-border'
                    }`}
                    {...register('minimum_stock', { valueAsNumber: true })}
                  />
                  {errors.minimum_stock && (
                    <p className="text-xs text-red-600">{errors.minimum_stock.message}</p>
                  )}
                </div>

                {/* Supplier */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Comercial Distribuidora Estética"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    {...register('supplier')}
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="product_is_active"
                    className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-4 h-4 cursor-pointer"
                    {...register('is_active')}
                  />
                  <label htmlFor="product_is_active" className="text-sm text-stone-700 font-medium cursor-pointer">
                    Producto Activo (disponible para consumos)
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-brand-border flex items-center justify-end space-x-3 bg-brand-cream/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-brand-border hover:bg-brand-light text-stone-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {formLoading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Drawer */}
      {isStockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsStockOpen(false)}
          />
          
          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-up md:animate-fade-in border-l border-brand-border">
            {/* Header */}
            <div className="h-16 border-b border-brand-border flex items-center justify-between px-6 bg-brand-cream/20">
              <div className="flex flex-col">
                <h3 className="font-serif text-lg font-bold text-brand-dark">Ajuste de Inventario</h3>
                <span className="text-xs text-stone-500">{selectedProduct.name}</span>
              </div>
              <button
                onClick={() => setIsStockOpen(false)}
                className="p-1.5 hover:bg-brand-light rounded-lg text-stone-400 hover:text-brand-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleStockSubmit} className="flex-grow flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {formError}
                  </div>
                )}

                <div className="p-4 bg-brand-light border border-brand-border rounded-lg text-xs space-y-1 text-stone-600">
                  <p><span className="font-semibold text-brand-dark">Stock Actual:</span> {selectedProduct.current_stock} {selectedProduct.unit}</p>
                  <p><span className="font-semibold text-brand-dark">Costo de Registro:</span> {formatCurrency(selectedProduct.unit_cost, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</p>
                </div>

                {/* Movement Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Tipo de Movimiento
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                    value={moveType}
                    onChange={(e) => handleMoveTypeChange(e.target.value)}
                  >
                    <option value="purchase">Entrada por Compra (Compra)</option>
                    <option value="adjustment">Ajuste Manual / Recuento (Ajuste)</option>
                    <option value="return">Devolución de Cliente (Devolución)</option>
                    <option value="waste">Merma / Pérdida (Merma)</option>
                  </select>
                </div>

                {/* Direction */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Efecto en Inventario
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setMoveDirection('increase')}
                      className={`py-2 px-3 border rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        moveDirection === 'increase'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-brand-border bg-stone-50 text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      <PlusCircle className="w-4.5 h-4.5" />
                      <span>Incrementar (+)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoveDirection('decrease')}
                      className={`py-2 px-3 border rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        moveDirection === 'decrease'
                          ? 'border-red-600 bg-red-50 text-red-800'
                          : 'border-brand-border bg-stone-50 text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      <MinusCircle className="w-4.5 h-4.5" />
                      <span>Reducir (-)</span>
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Cantidad a cambiar ({selectedProduct.unit})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={moveQuantity}
                    onChange={(e) => setMoveQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                  />
                </div>

                {/* Cost (only for purchases) */}
                {moveType === 'purchase' && (
                  <div className="space-y-3">
                    {/* Cost Calculator for Stock purchase */}
                    <div className="bg-stone-50 p-3.5 border border-brand-border rounded-xl space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="stock_use_calculator"
                          checked={stockUseCalculator}
                          onChange={(e) => {
                            setStockUseCalculator(e.target.checked);
                            if (!e.target.checked) {
                              setStockCalcCapacity('');
                              setStockCalcTotalCost('');
                            }
                          }}
                          className="rounded text-brand-primary focus:ring-brand-primary border-brand-border w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="stock_use_calculator" className="text-xs font-semibold text-brand-dark uppercase tracking-wider cursor-pointer">
                          Calcular costo por envase/capacidad
                        </label>
                      </div>

                      {stockUseCalculator && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase font-semibold">
                              Capacidad del envase ({selectedProduct.unit})
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="Ej. 700"
                              value={stockCalcCapacity}
                              onChange={(e) => setStockCalcCapacity(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-brand-border rounded bg-white text-xs text-brand-dark focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase font-semibold">
                              Costo del envase total ({APP_CURRENCY_SYMBOL})
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="Ej. 10000"
                              value={stockCalcTotalCost}
                              onChange={(e) => setStockCalcTotalCost(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-brand-border rounded bg-white text-xs text-brand-dark focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                        Costo Unitario de esta Compra ({APP_CURRENCY_SYMBOL})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-stone-400 text-sm">{APP_CURRENCY_SYMBOL}</span>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          required
                          value={moveCost}
                          onChange={(e) => setMoveCost(Number(e.target.value))}
                          className="w-full pl-8 pr-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                        />
                      </div>
                      <p className="text-[10px] text-stone-400">
                        Al ingresar stock por compra, el costo base de referencia del producto se actualizará a este valor.
                      </p>
                    </div>
                  </div>
                )}

                {/* Reference */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Referencia / Factura
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Factura #49283 / Ajuste Anual"
                    value={moveRef}
                    onChange={(e) => setMoveRef(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
                    Notas explicativas
                  </label>
                  <textarea
                    placeholder="Añade un motivo obligatorio..."
                    required={moveType === 'adjustment'}
                    rows={2}
                    value={moveNotes}
                    onChange={(e) => setMoveNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-dark"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-brand-border flex items-center justify-end space-x-3 bg-brand-cream/10">
                <button
                  type="button"
                  onClick={() => setIsStockOpen(false)}
                  className="px-4 py-2 border border-brand-border hover:bg-brand-light text-stone-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-brand-primary hover:bg-[#a58a73] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {formLoading ? 'Registrando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={formLoading}
        title="¿Eliminar producto?"
        description={`¿Estás seguro de que deseas eliminar permanentemente el producto "${productToDelete?.name}"? Se perderán también sus historiales de movimiento.`}
        confirmLabel="Eliminar producto"
      />
    </div>
  );
}
