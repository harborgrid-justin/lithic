'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';

interface GeneVariant {
  position: number;
  reference: string;
  alternate: string;
  consequence: string;
  impact: string;
  hgvsc?: string;
  hgvsp?: string;
}

interface GeneInfo {
  symbol: string;
  fullName: string;
  chromosome: string;
  start: number;
  end: number;
  strand: '+' | '-';
  description?: string;
  omimId?: string;
  function?: string;
  diseases?: string[];
  variants: GeneVariant[];
}

interface GeneViewerProps {
  gene: GeneInfo;
  loading?: boolean;
}

export function GeneViewer({ gene, loading = false }: GeneViewerProps) {
  const [selectedVariant, setSelectedVariant] = useState<GeneVariant | null>(null);

  const geneLength = gene.end - gene.start;

  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500',
      moderate: 'bg-yellow-500',
      low: 'bg-green-500',
      modifier: 'bg-gray-400',
    };
    return colors[impact] || 'bg-gray-400';
  };

  const getConsequenceBadge = (consequence: string) => {
    const styles: Record<string, string> = {
      missense_variant: 'bg-orange-100 text-orange-800',
      synonymous_variant: 'bg-green-100 text-green-800',
      stop_gained: 'bg-red-100 text-red-800',
      frameshift_variant: 'bg-red-100 text-red-800',
      splice_donor_variant: 'bg-red-100 text-red-800',
      splice_acceptor_variant: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={styles[consequence] || 'bg-gray-100 text-gray-800'}>
        {consequence.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading gene data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gene Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{gene.symbol}</CardTitle>
              <CardDescription className="text-base mt-1">{gene.fullName}</CardDescription>
            </div>
            <div className="flex gap-2">
              {gene.omimId && (
                <a
                  href={`https://omim.org/entry/${gene.omimId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  OMIM <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <a
                href={`https://www.ncbi.nlm.nih.gov/gene/?term=${gene.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                NCBI <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Location</div>
              <div className="font-mono font-medium">
                chr{gene.chromosome}:{gene.start.toLocaleString()}-{gene.end.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Length</div>
              <div className="font-medium">{(geneLength / 1000).toFixed(1)} kb</div>
            </div>
            <div>
              <div className="text-muted-foreground">Strand</div>
              <div className="font-medium">{gene.strand === '+' ? 'Forward' : 'Reverse'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Variants Found</div>
              <div className="font-medium">{gene.variants.length}</div>
            </div>
          </div>

          {gene.description && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">{gene.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gene Visualization and Details */}
      <Card>
        <CardHeader>
          <CardTitle>Gene Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="variants" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="function">Function</TabsTrigger>
              <TabsTrigger value="diseases">Disease Association</TabsTrigger>
            </TabsList>

            <TabsContent value="variants" className="space-y-4">
              {gene.variants.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No variants found in this gene</AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Visual representation */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">
                      Variant Distribution ({gene.variants.length} variants)
                    </div>
                    <div className="relative h-12 bg-white rounded border">
                      {/* Gene bar */}
                      <div className="absolute inset-0 bg-blue-100 rounded" />

                      {/* Variant markers */}
                      {gene.variants.map((variant, index) => {
                        const relativePosition =
                          ((variant.position - gene.start) / geneLength) * 100;

                        return (
                          <div
                            key={index}
                            className={`absolute top-0 w-2 h-12 ${getImpactColor(
                              variant.impact
                            )} cursor-pointer hover:opacity-75 transition-opacity`}
                            style={{ left: `${relativePosition}%` }}
                            onClick={() => setSelectedVariant(variant)}
                            title={`${variant.consequence} at ${variant.position}`}
                          />
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span>High Impact</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded" />
                        <span>Moderate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span>Low</span>
                      </div>
                    </div>
                  </div>

                  {/* Variant list */}
                  <div className="space-y-2">
                    {gene.variants.map((variant, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVariant === variant
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-mono text-sm">
                              {variant.hgvsc || `${variant.reference}>${variant.alternate}`}
                            </div>
                            {variant.hgvsp && (
                              <div className="font-mono text-xs text-muted-foreground mt-1">
                                {variant.hgvsp}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {getConsequenceBadge(variant.consequence)}
                            <Badge
                              variant="outline"
                              className={getImpactColor(variant.impact) + ' text-white border-0'}
                            >
                              {variant.impact}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Position: {variant.position.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="function" className="space-y-3">
              {gene.function ? (
                <div className="prose prose-sm max-w-none">
                  <p>{gene.function}</p>
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No functional information available for this gene
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="diseases" className="space-y-3">
              {gene.diseases && gene.diseases.length > 0 ? (
                <div className="space-y-2">
                  {gene.diseases.map((disease, index) => (
                    <div key={index} className="p-3 rounded-lg border">
                      <div className="font-medium">{disease}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No disease associations documented for this gene
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Variant Details */}
      {selectedVariant && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Variant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">Genomic Change</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Position:</dt>
                    <dd className="font-mono">{selectedVariant.position.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Reference:</dt>
                    <dd className="font-mono">{selectedVariant.reference}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Alternate:</dt>
                    <dd className="font-mono">{selectedVariant.alternate}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm">Functional Effect</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Consequence:</dt>
                    <dd>{getConsequenceBadge(selectedVariant.consequence)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Impact:</dt>
                    <dd>
                      <Badge variant="outline" className={`${getImpactColor(selectedVariant.impact)} text-white border-0`}>
                        {selectedVariant.impact}
                      </Badge>
                    </dd>
                  </div>
                  {selectedVariant.hgvsc && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">HGVSc:</dt>
                      <dd className="font-mono text-xs">{selectedVariant.hgvsc}</dd>
                    </div>
                  )}
                  {selectedVariant.hgvsp && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">HGVSp:</dt>
                      <dd className="font-mono text-xs">{selectedVariant.hgvsp}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
