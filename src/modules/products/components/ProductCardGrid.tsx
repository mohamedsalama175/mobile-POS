import React from 'react';
import { ProductItem } from '../../../types';
import { Card, CardBody, CardFooter } from '../../../components/ui/Card';
import { ItemThumbnail } from '../../../components/common/ItemThumbnail';
import { Badge } from '../../../components/ui/Badge';
import { Edit3, MapPin, Package } from 'lucide-react';

export interface ProductCardGridProps {
  product: ProductItem;
  onEdit: (product: ProductItem) => void;
  language: 'ar' | 'en';
}

export const ProductCardGrid: React.FC<ProductCardGridProps> = ({
  product,
  onEdit,
  language,
}) => {
  const isRtl = language === 'ar';
  const isOutOfStock = product.availableQty <= 0;
  const isLowStock = product.availableQty > 0 && product.availableQty <= 10;

  return (
    <Card interactive padding="md" className="flex flex-col justify-between h-full">
      <CardBody>
        {/* Top: Thumbnail & SKU Badge */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <ItemThumbnail
            src={product.imageUrl}
            name={product.name}
            size="lg"
            className="w-14 h-14 rounded-2xl"
          />
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200/80 dark:border-gray-700">
              #{product.code}
            </span>
            {isOutOfStock ? (
              <Badge variant="danger" size="sm" dot>
                {isRtl ? 'نفد الرصيد' : 'Out of Stock'}
              </Badge>
            ) : isLowStock ? (
              <Badge variant="warning" size="sm" dot>
                {isRtl ? `متبقي ${product.availableQty}` : `Low: ${product.availableQty}`}
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                {isRtl ? `متوفر: ${product.availableQty}` : `Stock: ${product.availableQty}`}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h4
          className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1"
          title={isRtl ? product.name : product.nameEn || product.name}
        >
          {isRtl ? product.name : product.nameEn || product.name}
        </h4>

        {/* Category & Unit */}
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2 truncate">
          <span>{product.category}</span>
          <span>•</span>
          <span>{isRtl ? product.unit : product.unitEn || product.unit}</span>
        </div>

        {/* Shelf location */}
        <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-blue-500" />
          <span>{isRtl ? `الرف: ${product.shelfNumber}` : `Shelf: ${product.shelfNumber}`}</span>
        </div>
      </CardBody>

      {/* Card Footer: Price & Edit Action */}
      <CardFooter className="mt-2 pt-2">
        <div className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
          {product.unitPrice.toFixed(2)} {isRtl ? 'ر.س' : 'SAR'}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(product);
          }}
          className="p-1.5 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          title={isRtl ? 'تعديل الصنف' : 'Edit Product'}
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </CardFooter>
    </Card>
  );
};
